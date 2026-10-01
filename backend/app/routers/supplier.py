"""Supplier / Manufacturer dashboard API.

Security model:
- require_role("supplier") guards every endpoint (admins also pass require_role
  by design, but all queries are still filtered by the current user's id).
- Product mutations verify ownership against Product.supplier_id — a
  client-supplied product id is never trusted alone (403 on mismatch).
- Order status transitions enforce a forward-only pipeline and the same
  ownership rule via crud.get_supplier_order.
"""
import json
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import schemas, crud, auth, models

router = APIRouter(prefix="/api/supplier", tags=["supplier"])

# ---------------------------------------------------------------------------
# Image uploads — local /uploads folder (no cloud storage for this scope).
# Files are renamed to a random uuid so user-supplied names never touch disk.
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB per file


def _save_upload(file: UploadFile) -> schemas.ImageUploadOut:
    """Validate type/size and persist one uploaded image. Raises 400/413."""
    ext = ALLOWED_IMAGE_TYPES.get((file.content_type or "").lower())
    if not ext:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WebP images are allowed")
    data = file.file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"'{file.filename}' exceeds the 5MB size limit")
    if not data:
        raise HTTPException(status_code=400, detail=f"'{file.filename}' is empty")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return schemas.ImageUploadOut(url=f"/uploads/{name}", filename=file.filename or name, size=len(data))


def _current_supplier(current_user=Depends(auth.require_role("supplier"))):
    """Dependency: authenticated user acting in supplier context."""
    return current_user


def _serialize_order(order) -> dict:
    """Enrich an order for dashboard display: buyer info + product names."""
    return {
        "id": order.id,
        "buyer_id": order.buyer_id,
        "buyer": order.buyer,
        "total": float(order.total or 0),
        "status": order.status.value if order.status else "pending",
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price or 0),
            }
            for item in order.items
        ],
    }


# ---------------------------------------------------------------------------
# Overview / stats
# ---------------------------------------------------------------------------

@router.get("/dashboard/stats", response_model=schemas.SupplierStatsOut)
def dashboard_stats(db: Session = Depends(auth.get_db), supplier=Depends(_current_supplier)):
    """KPI cards + recent orders + 14-day revenue trend for this supplier."""
    return crud.get_supplier_stats(db, supplier.id)


# ---------------------------------------------------------------------------
# Products (scoped to the owning supplier)
# ---------------------------------------------------------------------------

@router.get("/products", response_model=schemas.PaginatedSupplierProducts)
def list_my_products(
    q: str | None = None,
    category_id: int | None = None,
    status: str | None = Query(default=None, description="active|inactive|pending"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    products, total, page, page_size, total_pages = crud.list_supplier_products(
        db,
        supplier.id,
        q=q,
        category_id=category_id,
        status=status,
        page=page,
        page_size=page_size,
    )
    return {
        "items": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/products", response_model=schemas.ProductOut, status_code=201)
def create_product(
    payload: schemas.SupplierProductCreate,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    if payload.category_id is not None:
        if not crud.get_category(db, payload.category_id):
            raise HTTPException(status_code=400, detail="Invalid category")
    # crud.create_product marks every new listing is_approved=False; drafts
    # (is_draft=True) additionally stay out of the admin review queue until
    # the supplier submits them.
    return crud.create_product(db, payload, supplier_id=supplier.id)


@router.get("/products/{product_id}", response_model=schemas.ProductOut)
def get_my_product(
    product_id: int,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    """Fetch one of this supplier's products (pre-fills the edit form).

    A non-owned product returns 404 (not 403) so ids of other suppliers'
    products are not discoverable.
    """
    product = crud.get_product(db, product_id)
    if not product or product.supplier_id != supplier.id:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/uploads", response_model=list[schemas.ImageUploadOut])
async def upload_images(
    files: list[UploadFile] = File(...),
    supplier=Depends(_current_supplier),
):
    """Standalone image upload (used by the form before a product exists).

    Returns public /uploads/... URLs the frontend then includes in the
    create/update payload as image_urls.
    """
    return [_save_upload(f) for f in files]


@router.post("/products/{product_id}/images", response_model=list[schemas.ImageUploadOut])
async def upload_product_images(
    product_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    """Upload image(s) and attach them to an owned product's gallery."""
    product = crud.get_product(db, product_id)
    if not product or product.supplier_id != supplier.id:
        raise HTTPException(status_code=404, detail="Product not found")
    saved = [_save_upload(f) for f in files]
    # Append to the existing gallery; the first image stays the display image.
    try:
        existing = json.loads(product.image_urls) if product.image_urls else []
    except (TypeError, ValueError):
        existing = []
    all_urls = existing + [s.url for s in saved]
    product.image_urls = json.dumps(all_urls)
    if not product.image_url:
        product.image_url = all_urls[0]
    db.commit()
    return saved


@router.patch("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.SupplierProductUpdate,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Ownership check: never trust the id in the URL/body alone.
    if product.supplier_id != supplier.id:
        raise HTTPException(status_code=403, detail="You do not own this product")
    data = payload.dict(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if data.get("category_id") is not None:
        if not crud.get_category(db, data["category_id"]):
            raise HTTPException(status_code=400, detail="Invalid category")
    # Content changes on an approved, live product push it back into review
    # ("Changes pending approval"). Draft edits are exempt — drafts are not
    # public yet. Submitting a draft (is_draft=False) simply queues it.
    content_keys = {
        "name", "short_description", "description", "price", "moq", "unit",
        "tags", "image_url", "image_urls", "category_id",
    }
    # Draft saves never re-flag review; real content edits on live products do.
    if data.get("is_draft") is not True and product.is_approved and not product.is_draft and any(k in data for k in content_keys):
        product.is_approved = False
        product.rejection_reason = None
    return crud.update_product(db, product_id, data)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.supplier_id != supplier.id:
        raise HTTPException(status_code=403, detail="You do not own this product")
    # Soft delete: flip is_active so existing order history stays intact.
    product.is_active = False
    db.commit()
    return {"deleted": True, "product_id": product_id}


@router.patch("/products/{product_id}/toggle", response_model=schemas.ProductOut)
def toggle_product(
    product_id: int,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.supplier_id != supplier.id:
        raise HTTPException(status_code=403, detail="You do not own this product")
    product.is_active = not product.is_active
    db.commit()
    db.refresh(product)
    return product


# ---------------------------------------------------------------------------
# Orders (any order containing this supplier's products)
# ---------------------------------------------------------------------------

@router.get("/orders", response_model=list[schemas.SupplierOrderOut])
def list_orders(
    status: str | None = None,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    orders = crud.list_orders_for_supplier(db, supplier.id)
    if status:
        orders = [o for o in orders if (o.status.value if o.status else "pending") == status]
    return [_serialize_order(o) for o in orders]


@router.patch("/orders/{order_id}/status", response_model=schemas.SupplierOrderOut)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    # Ownership: the order must contain at least one product owned by us.
    order = crud.get_supplier_order(db, order_id, supplier.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found among your orders")
    try:
        updated = crud.advance_order_status(db, order_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _serialize_order(updated)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=schemas.SupplierAnalyticsOut)
def analytics(
    days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    """Best sellers, order-status mix and revenue-by-category for this supplier."""
    data = crud.supplier_analytics(db, supplier.id, days=days)

    # Date filter via subquery on orders (never join `orders` twice on one
    # query — SQLite raises ambiguous-column errors in that case).
    items = crud._supplier_items_query(db, supplier.id)
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        items = items.filter(
            models.OrderItem.order_id.in_(
                db.query(models.Order.id).filter(models.Order.created_at >= cutoff)
            )
        )
    # `items` already joins Product; only Category is added here (outer join
    # so uncategorised products roll up under "Uncategorized").
    cat_expr = func.coalesce(models.Category.name, "Uncategorized")
    rev_expr = func.coalesce(
        func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0
    )
    cat_rows = (
        items.join(models.Product.category, isouter=True)
        .with_entities(cat_expr, rev_expr)
        .group_by(cat_expr)
        .all()
    )
    revenue_by_category = [
        {"category": row[0], "revenue": round(float(row[1] or 0), 2)} for row in cat_rows
    ]
    return {
        "range": f"{days}d" if days else "all",
        **data,
        "revenue_by_category": revenue_by_category,
    }


# ---------------------------------------------------------------------------
# Store profile / settings
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=schemas.SupplierProfileOut)
def get_profile(supplier=Depends(_current_supplier)):
    return supplier


@router.patch("/profile", response_model=schemas.SupplierProfileOut)
def update_profile(
    payload: schemas.SupplierProfileUpdate,
    db: Session = Depends(auth.get_db),
    supplier=Depends(_current_supplier),
):
    updated = crud.update_supplier_profile(db, supplier.id, payload.dict(exclude_unset=True))
    return updated
