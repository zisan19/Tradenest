"""Admin platform-oversight API.

Security model:
- Every endpoint requires role == "admin" through auth.require_role("admin"),
  a backend dependency — hiding UI is never treated as security.
- Sensitive actions (role changes, suspensions, bulk status changes) are
  rate-limited per admin account.
- Approvals, rejections, suspensions, role changes and category edits are all
  recorded in the AuditLog table (who, what, when).
"""
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import schemas, crud, auth, models

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user=Depends(auth.get_current_user)):
    """Hard admin gate used by every route in this router.

    require_role already allows admins (and the target role) through; here we
    additionally verify the role is exactly "admin" so supplier-facing helpers
    can never accidentally satisfy this dependency.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ---------------------------------------------------------------------------
# Lightweight rate limiting for sensitive actions (in-memory, per admin)
# ---------------------------------------------------------------------------

_admin_action_log: dict[str, list[float]] = defaultdict(list)
ADMIN_ACTION_WINDOW = 60  # seconds
ADMIN_ACTION_MAX = 20  # sensitive actions per window per admin


def enforce_admin_action_limit(admin_id: int, action: str):
    key = f"{admin_id}:{action}"
    now = time.time()
    window = _admin_action_log[key]
    window[:] = [stamp for stamp in window if now - stamp < ADMIN_ACTION_WINDOW]
    if len(window) >= ADMIN_ACTION_MAX:
        raise HTTPException(status_code=429, detail="Too many admin actions — slow down and try again shortly.")
    window.append(now)


def _serialize_admin_order(order) -> dict:
    """Enrich an order with buyer identity, product names and supplier names."""
    buyer = None
    if order.buyer:
        buyer = {"id": order.buyer.id, "full_name": order.buyer.full_name, "email": order.buyer.email}
    items = [
        {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else None,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price or 0),
        }
        for item in order.items
    ]
    supplier_names = []
    for item in order.items:
        if item.product and item.product.supplier:
            label = item.product.supplier.company_name or item.product.supplier.full_name or item.product.supplier.email
            if label not in supplier_names:
                supplier_names.append(label)
    return {
        "id": order.id,
        "buyer_id": order.buyer_id,
        "buyer": buyer,
        "total": float(order.total or 0),
        "status": order.status.value if order.status else "pending",
        "created_at": order.created_at,
        "items": items,
        "supplier_names": supplier_names,
    }


# ---------------------------------------------------------------------------
# Dashboard overview
# ---------------------------------------------------------------------------

@router.get("/dashboard/stats", response_model=schemas.AdminStatsOut)
def dashboard_stats(db: Session = Depends(auth.get_db), admin=Depends(require_admin)):
    """Platform-wide totals, recent signups/orders and 14-day trends."""
    return crud.get_admin_stats(db)


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get("/users", response_model=list[schemas.AdminUserOut])
def list_users(
    q: str | None = None,
    role: str | None = Query(default=None, description="admin|supplier|buyer"),
    status: str | None = Query(default=None, description="active|suspended"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    users, _total = crud.list_users_filtered(db, q=q, role=role, status=status, skip=skip, limit=limit)
    return users


@router.patch("/users/{user_id}/status", response_model=schemas.AdminUserOut)
def set_user_status(
    user_id: int,
    payload: schemas.UserStatusUpdate,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "set_user_status")
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account")
    user = crud.set_user_active(db, admin.id, user_id, payload.is_active)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}/role", response_model=schemas.AdminUserOut)
def set_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "set_user_role")
    allowed_roles = {"admin", "supplier", "buyer"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of {sorted(allowed_roles)}")
    if user_id == admin.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote your own account")
    user = crud.set_user_role(db, admin.id, user_id, payload.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Supplier / product approval queue
# ---------------------------------------------------------------------------

@router.get("/suppliers/pending", response_model=list[schemas.PendingSupplierOut])
def pending_suppliers(db: Session = Depends(auth.get_db), admin=Depends(require_admin)):
    rows = crud.list_pending_suppliers(db)
    return [
        {
            **schemas.AdminUserOut.from_orm(row["user"]).dict(),
            "product_count": row["product_count"],
            "pending_product_count": row["pending_product_count"],
        }
        for row in rows
    ]


@router.patch("/suppliers/{supplier_id}/approve", response_model=schemas.AdminUserOut)
def approve_supplier(
    supplier_id: int,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "supplier_review")
    supplier = crud.approve_supplier(db, admin.id, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.patch("/suppliers/{supplier_id}/reject", response_model=schemas.AdminUserOut)
def reject_supplier(
    supplier_id: int,
    payload: schemas.RejectRequest,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "supplier_review")
    supplier = crud.reject_supplier(db, admin.id, supplier_id, payload.reason)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.get("/products/pending", response_model=list[schemas.PendingProductOut])
def pending_products(db: Session = Depends(auth.get_db), admin=Depends(require_admin)):
    products = crud.list_pending_products(db)
    result = []
    for p in products:
        item = schemas.PendingProductOut.from_orm(p)
        item.supplier_name = p.supplier.full_name if p.supplier else None
        item.supplier_company = (p.supplier.company_name if p.supplier else None) or (
            p.supplier.email if p.supplier else None
        )
        result.append(item)
    return result


@router.patch("/products/{product_id}/approve", response_model=schemas.ProductOut)
def approve_product(
    product_id: int,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "product_review")
    product = crud.approve_product(db, admin.id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/products/{product_id}/reject", response_model=schemas.ProductOut)
def reject_product(
    product_id: int,
    payload: schemas.RejectRequest,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "product_review")
    product = crud.reject_product(db, admin.id, product_id, payload.reason)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---------------------------------------------------------------------------
# Categories (full CRUD, existing public listing stays in /api/categories)
# ---------------------------------------------------------------------------

@router.post("/categories", response_model=schemas.CategoryOut, status_code=201)
def admin_create_category(
    payload: schemas.CategoryCreate,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "category_edit")
    try:
        category = crud.create_category(
            db, payload.name, description=payload.description, icon=payload.icon
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Category name already exists")
    category.color_tag = payload.color_tag
    db.commit()
    db.refresh(category)
    crud.record_audit_log(db, admin.id, "create_category", "category", category.id, payload.name)
    return category


@router.patch("/categories/{category_id}", response_model=schemas.CategoryOut)
def admin_update_category(
    category_id: int,
    payload: schemas.CategoryUpdate,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "category_edit")
    existing = crud.get_category(db, category_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.dict(exclude_unset=True)
    try:
        updated = crud.update_category(
            db,
            category_id,
            data.get("name", existing.name),
            description=data.get("description", existing.description),
            icon=data.get("icon", existing.icon),
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Category name already exists")
    if "color_tag" in data:
        updated.color_tag = data["color_tag"]
    db.commit()
    db.refresh(updated)
    crud.record_audit_log(db, admin.id, "update_category", "category", category_id)
    return updated


@router.delete("/categories/{category_id}")
def admin_delete_category(
    category_id: int,
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    enforce_admin_action_limit(admin.id, "category_edit")
    existing = crud.get_category(db, category_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    in_use = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    if in_use:
        raise HTTPException(status_code=400, detail=f"Category is used by {in_use} product(s); move them first")
    crud.delete_category(db, category_id)
    crud.record_audit_log(db, admin.id, "delete_category", "category", category_id, existing.name)
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Order oversight (read across all suppliers/buyers)
# ---------------------------------------------------------------------------

@router.get("/orders", response_model=list[schemas.AdminOrderOut])
def list_all_orders(
    status: str | None = Query(default=None),
    supplier_id: int | None = None,
    days: int | None = Query(default=None, ge=1, le=365),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    try:
        orders, _total = crud.list_orders_filtered(
            db, status=status, supplier_id=supplier_id, days=days, skip=skip, limit=limit
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return [_serialize_admin_order(o) for o in orders]


# ---------------------------------------------------------------------------
# Platform analytics
# ---------------------------------------------------------------------------

@router.get("/analytics")
def platform_analytics(
    days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    return crud.admin_analytics(db, days=days)


# ---------------------------------------------------------------------------
# Audit trail
# ---------------------------------------------------------------------------

@router.get("/audit-logs")
def audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(auth.get_db),
    admin=Depends(require_admin),
):
    logs = crud.list_audit_logs(db, limit=limit)
    return [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "admin_email": log.admin.email if log.admin else None,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "detail": log.detail,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
