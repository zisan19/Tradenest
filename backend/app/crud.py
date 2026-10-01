import json

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from . import models, schemas, auth
from typing import List
from datetime import datetime, date as datetime_date, time as time_cls, timedelta


def utcnow():
    return datetime.utcnow()

# Users

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    clean_email = email.strip().lower()
    return db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed = auth.get_password_hash(user.password)
    verified = user.role != 'supplier'
    db_user = models.User(
        email=user.email.strip().lower(),
        full_name=user.full_name,
        hashed_password=hashed,
        role=user.role,
        is_verified=verified,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_profile(db: Session, user_id: int, full_name: str = None, password: str = None):
    u = get_user(db, user_id)
    if not u:
        return None
    if full_name is not None:
        u.full_name = full_name
    if password:
        u.hashed_password = auth.get_password_hash(password)
    db.commit()
    db.refresh(u)
    return u


def delete_user(db: Session, user_id: int):
    u = get_user(db, user_id)
    if not u:
        return False
    db.delete(u)
    db.commit()
    return True


def verify_user(db: Session, user_id: int, verified: bool = True):
    u = get_user(db, user_id)
    if not u:
        return None
    u.is_verified = verified
    db.commit()
    db.refresh(u)
    return u

# Categories

def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def create_category(db: Session, name: str, description: str = None, icon: str = None):
    slug = name.lower().replace(' ', '-')
    cat = models.Category(name=name, slug=slug, icon=icon, description=description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update_category(db: Session, category_id: int, name: str, description: str = None, icon: str = None):
    cat = get_category(db, category_id)
    if not cat:
        return None
    cat.name = name
    cat.slug = name.lower().replace(' ', '-')
    cat.description = description
    cat.icon = icon
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, category_id: int):
    cat = get_category(db, category_id)
    if not cat:
        return False
    db.delete(cat)
    db.commit()
    return True


def list_categories(db: Session):
    return db.query(models.Category).all()

# Products

def _product_form_data(obj) -> dict:
    """Normalize a create/update payload into clean Product columns.

    tags/image_urls arrive as lists from the schemas; they are stored
    comma-separated / JSON-encoded respectively.
    """
    data = obj if isinstance(obj, dict) else obj.dict(exclude_unset=True)
    tags = data.pop("tags", None)
    if tags is not None:
        data["tags"] = ",".join(tags)
    images = data.pop("image_urls", None)
    if images is not None:
        data["image_urls"] = json.dumps(images)
    if data.get("image_url") is None and "image_urls" in data:
        try:
            parsed = json.loads(data["image_urls"])
            if parsed:
                data["image_url"] = parsed[0]
        except (TypeError, ValueError):
            pass
    return data


def create_product(db: Session, product, supplier_id: int):
    """Create a product from a ProductCreate or SupplierProductCreate payload.

    Every new listing starts pending admin approval; `is_draft=True` saves it
    out of the review queue until the supplier submits it.
    """
    data = _product_form_data(product)
    is_draft = bool(data.pop("is_draft", False))
    p = models.Product(
        supplier_id=supplier_id,
        is_approved=False,        # new listings await admin review
        is_draft=is_draft,        # drafts stay out of the queue until submitted
        is_active=True,
        **data,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def get_product(db: Session, product_id: int):
    return (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.supplier))
        .filter(models.Product.id == product_id)
        .first()
    )


def list_products(db: Session, skip: int = 0, limit: int = 50, q: str = None, category_id: int = None):
    query = (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.supplier))
        .filter(models.Product.is_approved == True)
    )
    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    return query.offset(skip).limit(limit).all()


def update_product(db: Session, product_id: int, data):
    """Apply a partial update dict (or Pydantic model) to a product."""
    p = get_product(db, product_id)
    if not p:
        return None
    for k, v in _product_form_data(data).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


def delete_product(db: Session, product_id: int):
    p = get_product(db, product_id)
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True

# Orders

def get_order(db: Session, order_id: int):
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order_id)
        .first()
    )


def create_order(db: Session, buyer_id: int, items: List[schemas.OrderItemCreate]):
    total = 0.0
    order = models.Order(buyer_id=buyer_id, total=0.0)
    db.add(order)
    db.commit()
    db.refresh(order)
    for it in items:
        prod = get_product(db, it.product_id)
        if not prod:
            raise ValueError(f"Product not found: {it.product_id}")
        if prod.stock < it.quantity:
            raise ValueError(f"Insufficient stock for {prod.name}")
        unit_price = prod.price
        item_total = unit_price * it.quantity
        total += item_total
        oi = models.OrderItem(order_id=order.id, product_id=prod.id, quantity=it.quantity, unit_price=unit_price)
        db.add(oi)
        prod.stock -= it.quantity
    order.total = total
    db.commit()
    db.refresh(order)
    return order


def list_orders_for_user(db: Session, user_id: int):
    return db.query(models.Order).filter(models.Order.buyer_id == user_id).order_by(models.Order.created_at.desc()).all()


def list_orders_for_supplier(db: Session, supplier_id: int):
    return (
        db.query(models.Order)
        .join(models.Order.items)
        .join(models.OrderItem.product)
        .filter(models.Product.supplier_id == supplier_id)
        .distinct()
        .order_by(models.Order.created_at.desc())
        .all()
    )


def update_order_status(db: Session, order_id: int, status: str):
    o = get_order(db, order_id)
    if not o:
        return None
    if status not in [s.value for s in models.OrderStatus]:
        raise ValueError("Invalid order status")
    o.status = models.OrderStatus(status)
    db.commit()
    db.refresh(o)
    return o


def list_recent_orders(db: Session, limit: int = 10):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).limit(limit).all()

# Dashboard

def get_dashboard_stats(db: Session, current_user: models.User):
    if current_user.role == 'admin':
        total_users = db.query(func.count(models.User.id)).scalar()
        total_products = db.query(func.count(models.Product.id)).scalar()
        total_orders = db.query(func.count(models.Order.id)).scalar()
        total_revenue = db.query(func.coalesce(func.sum(models.Order.total), 0.0)).scalar()
        pending_orders = db.query(func.count(models.Order.id)).filter(models.Order.status == models.OrderStatus.pending).scalar()
        return {
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue or 0),
            'pending_orders': pending_orders,
        }
    if current_user.role == 'supplier':
        product_count = db.query(func.count(models.Product.id)).filter(models.Product.supplier_id == current_user.id).scalar()
        total_sales = (
            db.query(func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0))
            .join(models.Order)
            .join(models.Product)
            .filter(models.Product.supplier_id == current_user.id)
            .scalar()
        )
        order_count = (
            db.query(func.count(models.Order.id))
            .join(models.Order.items)
            .join(models.Product)
            .filter(models.Product.supplier_id == current_user.id)
            .distinct()
            .scalar()
        )
        return {
            'product_count': product_count,
            'order_count': order_count,
            'total_sales': float(total_sales or 0),
        }
    order_count = db.query(func.count(models.Order.id)).filter(models.Order.buyer_id == current_user.id).scalar()
    total_spent = db.query(func.coalesce(func.sum(models.Order.total), 0.0)).filter(models.Order.buyer_id == current_user.id).scalar()
    return {
        'order_count': order_count,
        'total_spent': float(total_spent or 0),
    }


# Refresh token helpers
def create_refresh_token_entry(db: Session, user_id: int, jti: str, expires_at):
    rt = models.RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at)
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


def get_refresh_token(db: Session, jti: str):
    return db.query(models.RefreshToken).filter(models.RefreshToken.jti == jti).first()


def revoke_refresh_token(db: Session, jti: str):
    rt = get_refresh_token(db, jti)
    if not rt:
        return False
    rt.revoked = True
    db.commit()
    return True


def revoke_all_user_refresh_tokens(db: Session, user_id: int):
    db.query(models.RefreshToken).filter(models.RefreshToken.user_id == user_id, models.RefreshToken.revoked == False).update({models.RefreshToken.revoked: True})
    db.commit()
    return True


# =========================================================
# Cart Operations
# =========================================================

def get_or_create_cart(db: Session, buyer_id: int) -> models.Cart:
    cart = (
        db.query(models.Cart)
        .options(joinedload(models.Cart.items).joinedload(models.CartItem.product))
        .filter(models.Cart.buyer_id == buyer_id)
        .first()
    )
    if not cart:
        cart = models.Cart(buyer_id=buyer_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def get_cart_details(db: Session, buyer_id: int):
    cart = get_or_create_cart(db, buyer_id)
    total_items = sum(item.quantity for item in cart.items)
    subtotal = sum(item.quantity * item.price_snapshot for item in cart.items)
    return {
        "id": cart.id,
        "buyer_id": cart.buyer_id,
        "items": cart.items,
        "total_items": total_items,
        "subtotal": round(subtotal, 2),
        "created_at": cart.created_at,
    }


def add_cart_item(db: Session, buyer_id: int, product_id: int, quantity: int):
    product = get_product(db, product_id)
    if not product:
        raise ValueError("Product not found")
    if quantity < product.moq:
        raise ValueError(f"Minimum order quantity (MOQ) for {product.name} is {product.moq} units")
    if quantity > product.stock:
        raise ValueError(f"Requested quantity ({quantity}) exceeds available stock ({product.stock})")

    cart = get_or_create_cart(db, buyer_id)
    # Check if item already exists in cart
    existing_item = next((item for item in cart.items if item.product_id == product_id), None)
    if existing_item:
        new_qty = existing_item.quantity + quantity
        if new_qty > product.stock:
            raise ValueError(f"Total quantity ({new_qty}) exceeds available stock ({product.stock})")
        existing_item.quantity = new_qty
        existing_item.price_snapshot = product.price
        db.commit()
        db.refresh(existing_item)
    else:
        new_item = models.CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            price_snapshot=product.price,
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
    return get_cart_details(db, buyer_id)


def update_cart_item(db: Session, buyer_id: int, item_id: int, quantity: int):
    item = (
        db.query(models.CartItem)
        .join(models.Cart)
        .filter(models.CartItem.id == item_id, models.Cart.buyer_id == buyer_id)
        .first()
    )
    if not item:
        raise ValueError("Cart item not found")
    product = item.product or get_product(db, item.product_id)
    if quantity < product.moq:
        raise ValueError(f"Quantity cannot be less than MOQ ({product.moq})")
    if quantity > product.stock:
        raise ValueError(f"Quantity exceeds available stock ({product.stock})")
    item.quantity = quantity
    item.price_snapshot = product.price
    db.commit()
    db.refresh(item)
    return get_cart_details(db, buyer_id)


def delete_cart_item(db: Session, buyer_id: int, item_id: int):
    item = (
        db.query(models.CartItem)
        .join(models.Cart)
        .filter(models.CartItem.id == item_id, models.Cart.buyer_id == buyer_id)
        .first()
    )
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def clear_cart(db: Session, buyer_id: int):
    cart = db.query(models.Cart).filter(models.Cart.buyer_id == buyer_id).first()
    if cart:
        db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
        db.commit()
    return True


# =========================================================
# Payment Operations (Academic Simulation / Demo Only)
# =========================================================

def create_simulated_payment(
    db: Session,
    order_id: int,
    method: str,
    amount: float,
    transaction_ref: str,
    status: str = "success",
):
    payment = models.Payment(
        order_id=order_id,
        method=method,
        amount=amount,
        currency="USD",
        status=models.PaymentStatus(status),
        transaction_ref=transaction_ref,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment_by_order(db: Session, order_id: int):
    return db.query(models.Payment).filter(models.Payment.order_id == order_id).first()


# =========================================================
# Audit log (admin actions)
# =========================================================

def record_audit_log(db: Session, admin_id: int, action: str, target_type: str, target_id: int | None = None, detail: str | None = None):
    """Persist an audit-trail entry for a privileged action."""
    entry = models.AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    )
    db.add(entry)
    db.commit()
    return entry


def list_audit_logs(db: Session, limit: int = 50):
    return (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )


# =========================================================
# Supplier dashboard helpers
# =========================================================

def _supplier_items_query(db: Session, supplier_id: int):
    """OrderItem rows restricted to this supplier's own products."""
    return (
        db.query(models.OrderItem)
        .join(models.Product, models.OrderItem.product_id == models.Product.id)
        .filter(models.Product.supplier_id == supplier_id)
    )


def get_supplier_stats(db: Session, supplier_id: int) -> dict:
    """Aggregate KPIs for a supplier's own storefront."""
    total_products = (
        db.query(func.count(models.Product.id))
        .filter(models.Product.supplier_id == supplier_id, models.Product.is_active == True)
        .scalar()
    )

    items = _supplier_items_query(db, supplier_id)
    total_orders = (
        items.with_entities(func.count(func.distinct(models.OrderItem.order_id))).scalar()
    )
    total_units = items.with_entities(func.coalesce(func.sum(models.OrderItem.quantity), 0)).scalar()
    total_revenue = items.with_entities(
        func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0)
    ).scalar()

    # Count orders still awaiting confirmation that contain this supplier's items
    pending_orders = (
        items.join(models.Order)
        .filter(models.Order.status == models.OrderStatus.pending)
        .with_entities(func.count(func.distinct(models.OrderItem.order_id)))
        .scalar()
    )

    # --- Revenue trend: last 14 days, calendar-day buckets -----------------
    today = datetime_date.today()
    trend = []
    for offset in range(13, -1, -1):
        day = today - timedelta(days=offset)
        day_start = datetime.combine(day, time_cls.min)
        day_end = day_start + timedelta(days=1)
        day_items = (
            _supplier_items_query(db, supplier_id)
            .join(models.Order)
            .filter(models.Order.created_at >= day_start, models.Order.created_at < day_end)
        )
        revenue = day_items.with_entities(
            func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0)
        ).scalar()
        orders = day_items.with_entities(func.count(func.distinct(models.OrderItem.order_id))).scalar()
        trend.append(
            {
                "label": day.strftime("%b %d"),
                "revenue": round(float(revenue or 0), 2),
                "orders": int(orders or 0),
            }
        )

    # Simple comparison vs the previous 7-day window for trend arrows
    def window_revenue(start_offset: int, end_offset: int) -> float:
        start = datetime.combine(today - timedelta(days=start_offset), time_cls.min)
        end = datetime.combine(today - timedelta(days=end_offset), time_cls.min)
        value = (
            _supplier_items_query(db, supplier_id)
            .join(models.Order)
            .filter(models.Order.created_at >= start, models.Order.created_at < end)
            .with_entities(func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0))
            .scalar()
        )
        return float(value or 0)

    current_week = window_revenue(6, -1)
    previous_week = window_revenue(13, 6)
    revenue_change = None
    if previous_week > 0:
        revenue_change = round(((current_week - previous_week) / previous_week) * 100, 1)

    recent = (
        db.query(models.Order)
        .join(models.Order.items)
        .join(models.OrderItem.product)
        .filter(models.Product.supplier_id == supplier_id)
        .distinct()
        .order_by(models.Order.created_at.desc())
        .limit(8)
        .all()
    )
    recent_orders = [
        {
            "id": o.id,
            "buyer_name": o.buyer.full_name if o.buyer else None,
            "total": float(o.total or 0),
            "status": o.status.value if o.status else "pending",
            "created_at": o.created_at,
        }
        for o in recent
    ]

    return {
        "total_products": int(total_products or 0),
        "total_active_products": int(total_products or 0),
        "total_orders": int(total_orders or 0),
        "total_revenue": round(float(total_revenue or 0), 2),
        "total_units_sold": int(total_units or 0),
        "pending_orders": int(pending_orders or 0),
        "revenue_change_pct": revenue_change,
        "recent_orders": recent_orders,
        "revenue_trend": trend,
    }


def list_supplier_products(
    db: Session,
    supplier_id: int,
    q: str | None = None,
    category_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 10,
):
    """Paginated/searchable listing restricted to the owning supplier.

    status filter: "active" | "inactive" | "pending" | "draft" | None (all).
    "draft" means is_draft=True (saved locally, not yet submitted for review).
    "pending" maps to is_approved=False AND is_draft=False (in the review queue).
    "active" means approved AND is_active.
    "inactive" means is_active=False (soft-deleted / delisted).
    "out_of_stock" is exposed through ProductOut.stock == 0 on the frontend.
    """
    query = db.query(models.Product).filter(models.Product.supplier_id == supplier_id)
    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if status == "active":
        query = query.filter(models.Product.is_active == True, models.Product.is_approved == True)
    elif status == "inactive":
        query = query.filter(models.Product.is_active == False)
    elif status == "pending":
        query = query.filter(
            models.Product.is_approved == False,
            models.Product.is_draft == False,
        )
    elif status == "draft":
        query = query.filter(models.Product.is_draft == True)

    total = query.count()
    page = max(page, 1)
    page_size = max(1, min(page_size, 100))
    products = (
        query.options(joinedload(models.Product.category))
        .order_by(models.Product.created_at.desc(), models.Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    total_pages = (total + page_size - 1) // page_size if total else 1
    return products, total, page, page_size, total_pages


def get_supplier_order(db: Session, order_id: int, supplier_id: int):
    """Fetch an order only if it contains at least one product owned by supplier_id.

    This is the ownership check used by status transitions — the caller must not
    trust an order_id coming from the request body alone.
    """
    order = get_order(db, order_id)
    if not order:
        return None
    if any(item.product and item.product.supplier_id == supplier_id for item in order.items):
        return order
    return None


# Forward-only status pipeline for suppliers
SUPPLIER_STATUS_PIPELINE = [
    models.OrderStatus.pending.value,
    models.OrderStatus.confirmed.value,
    models.OrderStatus.shipped.value,
    models.OrderStatus.delivered.value,
]


def advance_order_status(db: Session, order_id: int, new_status: str):
    """Validate forward-only transitions (pending -> confirmed -> shipped -> delivered)."""
    order = get_order(db, order_id)
    if not order:
        return None
    current = order.status.value if order.status else models.OrderStatus.pending.value
    if new_status not in SUPPLIER_STATUS_PIPELINE:
        raise ValueError(f"Invalid status '{new_status}'")
    if SUPPLIER_STATUS_PIPELINE.index(new_status) <= SUPPLIER_STATUS_PIPELINE.index(current):
        raise ValueError(f"Cannot move order from '{current}' to '{new_status}' — only forward transitions allowed")
    order.status = models.OrderStatus(new_status)
    db.commit()
    db.refresh(order)
    return order


def supplier_analytics(db: Session, supplier_id: int, days: int | None = None) -> dict:
    """Best-selling products + order status mix, optionally within a date window."""
    cutoff = datetime.utcnow() - timedelta(days=days) if days else None

    # Best sellers: filter by date through a subquery on orders so the orders
    # table is never joined twice on the same query (SQLite would raise
    # "ambiguous column" errors).
    items = _supplier_items_query(db, supplier_id)
    if cutoff:
        recent_order_ids = (
            db.query(models.Order.id).filter(models.Order.created_at >= cutoff).subquery()
        )
        items = items.filter(models.OrderItem.order_id.in_(db.query(recent_order_ids)))

    # `items` already joins Product via _supplier_items_query, so Product
    # columns are directly referenceable here (no second join).
    best = (
        items.with_entities(
            models.Product.id,
            models.Product.name,
            func.coalesce(func.sum(models.OrderItem.quantity), 0).label("units"),
            func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0).label("revenue"),
        )
        .group_by(models.Product.id, models.Product.name)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(6)
        .all()
    )
    best_selling = [
        {
            "product_id": row.id,
            "name": row.name,
            "units_sold": int(row.units or 0),
            "revenue": round(float(row.revenue or 0), 2),
        }
        for row in best
    ]

    # Status mix: separate query with its own single orders join.
    status_items = _supplier_items_query(db, supplier_id).join(models.Order)
    if cutoff:
        status_items = status_items.filter(models.Order.created_at >= cutoff)
    status_rows = (
        status_items.with_entities(models.Order.status, func.count(func.distinct(models.Order.id)))
        .group_by(models.Order.status)
        .all()
    )
    orders_by_status = [
        {"status": (row[0].value if row[0] else "pending"), "count": int(row[1] or 0)} for row in status_rows
    ]

    return {"best_selling": best_selling, "orders_by_status": orders_by_status}


def update_supplier_profile(db: Session, user_id: int, data: dict):
    user = get_user(db, user_id)
    if not user:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


# =========================================================
# Admin dashboard helpers
# =========================================================

def list_users_filtered(db: Session, q: str | None = None, role: str | None = None, status: str | None = None, skip: int = 0, limit: int = 100):
    query = db.query(models.User)
    if q:
        like = f"%{q}%"
        query = query.filter((models.User.email.ilike(like)) | (models.User.full_name.ilike(like)))
    if role:
        query = query.filter(models.User.role == role)
    if status == "active":
        query = query.filter(models.User.is_active == True)
    elif status == "suspended":
        query = query.filter(models.User.is_active == False)
    total = query.count()
    users = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
    return users, total


def set_user_active(db: Session, admin_id: int, user_id: int, is_active: bool):
    user = get_user(db, user_id)
    if not user:
        return None
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    if not is_active:
        # Suspend = kill sessions too
        revoke_all_user_refresh_tokens(db, user_id)
    record_audit_log(
        db,
        admin_id=admin_id,
        action="activate_user" if is_active else "suspend_user",
        target_type="user",
        target_id=user_id,
        detail=f"role={user.role}",
    )
    return user


def set_user_role(db: Session, admin_id: int, user_id: int, role: str):
    user = get_user(db, user_id)
    if not user:
        return None
    old_role = user.role
    user.role = role
    # Role switches follow the same verification defaults as create_user
    if role == "supplier":
        user.is_approved = False
        user.is_verified = False
    db.commit()
    db.refresh(user)
    record_audit_log(db, admin_id=admin_id, action="change_role", target_type="user", target_id=user_id, detail=f"{old_role}->{role}")
    return user


def list_pending_suppliers(db: Session):
    """Suppliers awaiting approval (is_approved=False) with product counters."""
    suppliers = (
        db.query(models.User)
        .filter(models.User.role == "supplier", models.User.is_approved == False)
        .order_by(models.User.created_at.asc())
        .all()
    )
    result = []
    for s in suppliers:
        total_products = db.query(func.count(models.Product.id)).filter(models.Product.supplier_id == s.id).scalar()
        pending_products = (
            db.query(func.count(models.Product.id))
            .filter(
                models.Product.supplier_id == s.id,
                models.Product.is_approved == False,
                models.Product.is_draft == False,
            )
            .scalar()
        )
        result.append({"user": s, "product_count": int(total_products or 0), "pending_product_count": int(pending_products or 0)})
    return result


def approve_supplier(db: Session, admin_id: int, supplier_id: int):
    supplier = get_user(db, supplier_id)
    if not supplier or supplier.role != "supplier":
        return None
    supplier.is_approved = True
    supplier.is_verified = True
    db.commit()
    db.refresh(supplier)
    record_audit_log(db, admin_id=admin_id, action="approve_supplier", target_type="user", target_id=supplier_id)
    return supplier


def reject_supplier(db: Session, admin_id: int, supplier_id: int, reason: str | None = None):
    supplier = get_user(db, supplier_id)
    if not supplier or supplier.role != "supplier":
        return None
    supplier.is_approved = False
    supplier.is_verified = False
    db.commit()
    db.refresh(supplier)
    record_audit_log(db, admin_id=admin_id, action="reject_supplier", target_type="user", target_id=supplier_id, detail=reason)
    return supplier


def list_pending_products(db: Session):
    """Products awaiting admin review: not approved and not supplier drafts."""
    return (
        db.query(models.Product)
        .options(joinedload(models.Product.supplier), joinedload(models.Product.category))
        .filter(
            models.Product.is_approved == False,
            models.Product.is_draft == False,
        )
        .order_by(models.Product.created_at.asc())
        .all()
    )


def approve_product(db: Session, admin_id: int, product_id: int):
    product = get_product(db, product_id)
    if not product:
        return None
    product.is_approved = True
    product.rejection_reason = None
    db.commit()
    db.refresh(product)
    record_audit_log(db, admin_id=admin_id, action="approve_product", target_type="product", target_id=product_id)
    return product


def reject_product(db: Session, admin_id: int, product_id: int, reason: str | None = None):
    product = get_product(db, product_id)
    if not product:
        return None
    product.is_approved = False
    product.rejection_reason = reason
    db.commit()
    db.refresh(product)
    record_audit_log(db, admin_id=admin_id, action="reject_product", target_type="product", target_id=product_id, detail=reason)
    return product


def list_orders_filtered(db: Session, status: str | None = None, supplier_id: int | None = None, days: int | None = None, skip: int = 0, limit: int = 50):
    """Platform-wide order list for admin oversight with filters."""
    query = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    )
    if status:
        try:
            query = query.filter(models.Order.status == models.OrderStatus(status))
        except ValueError:
            raise ValueError(f"Invalid status '{status}'")
    if supplier_id:
        query = query.join(models.Order.items).join(models.OrderItem.product).filter(models.Product.supplier_id == supplier_id).distinct()
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(models.Order.created_at >= cutoff)
    total = query.count()
    orders = (
        query.order_by(models.Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orders, total


def get_admin_stats(db: Session) -> dict:
    """Platform-wide aggregate stats for the admin overview tab."""
    total_users = db.query(func.count(models.User.id)).scalar()
    total_buyers = db.query(func.count(models.User.id)).filter(models.User.role == "buyer").scalar()
    total_suppliers = db.query(func.count(models.User.id)).filter(models.User.role == "supplier").scalar()
    total_admins = db.query(func.count(models.User.id)).filter(models.User.role == "admin").scalar()
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_active_products = (
        db.query(func.count(models.Product.id)).filter(models.Product.is_active == True, models.Product.is_approved == True).scalar()
    )
    pending_products = db.query(func.count(models.Product.id)).filter(
        models.Product.is_approved == False, models.Product.is_draft == False
    ).scalar()
    pending_suppliers = (
        db.query(func.count(models.User.id)).filter(models.User.role == "supplier", models.User.is_approved == False).scalar()
    )
    total_orders = db.query(func.count(models.Order.id)).scalar()
    total_revenue = db.query(func.coalesce(func.sum(models.Order.total), 0.0)).scalar()

    recent_signups = db.query(models.User).order_by(models.User.created_at.desc()).limit(6).all()

    today = datetime_date.today()
    revenue_trend = []
    signup_trend = []
    for offset in range(13, -1, -1):
        day = today - timedelta(days=offset)
        day_start = datetime.combine(day, time_cls.min)
        day_end = day_start + timedelta(days=1)
        rev = db.query(func.coalesce(func.sum(models.Order.total), 0.0)).filter(
            models.Order.created_at >= day_start, models.Order.created_at < day_end
        ).scalar()
        orders = db.query(func.count(models.Order.id)).filter(
            models.Order.created_at >= day_start, models.Order.created_at < day_end
        ).scalar()
        signups = db.query(func.count(models.User.id)).filter(
            models.User.created_at >= day_start, models.User.created_at < day_end
        ).scalar()
        label = day.strftime("%b %d")
        revenue_trend.append({"label": label, "revenue": round(float(rev or 0), 2), "orders": int(orders or 0)})
        signup_trend.append({"label": label, "signups": int(signups or 0)})

    recent_orders = [
        {
            "id": o.id,
            "buyer_name": o.buyer.full_name if o.buyer else None,
            "total": float(o.total or 0),
            "status": o.status.value if o.status else "pending",
            "created_at": o.created_at,
        }
        for o in db.query(models.Order).order_by(models.Order.created_at.desc()).limit(8).all()
    ]

    return {
        "total_users": int(total_users or 0),
        "total_buyers": int(total_buyers or 0),
        "total_suppliers": int(total_suppliers or 0),
        "total_admins": int(total_admins or 0),
        "total_products": int(total_products or 0),
        "total_active_products": int(total_active_products or 0),
        "pending_products": int(pending_products or 0),
        "pending_suppliers": int(pending_suppliers or 0),
        "total_orders": int(total_orders or 0),
        "total_revenue": round(float(total_revenue or 0), 2),
        "recent_signups": recent_signups,
        "recent_orders": recent_orders,
        "revenue_trend": revenue_trend,
        "signup_trend": signup_trend,
    }


def admin_analytics(db: Session, days: int | None = None) -> dict:
    """Platform analytics: revenue by category, top suppliers, status mix."""
    items = db.query(models.OrderItem).join(models.Order)
    orders_q = db.query(models.Order)
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        items = items.filter(models.Order.created_at >= cutoff)
        orders_q = orders_q.filter(models.Order.created_at >= cutoff)

    cat_rows = (
        items.join(models.Product, models.OrderItem.product_id == models.Product.id)
        .join(models.Category, models.Product.category_id == models.Category.id, isouter=True)
        .with_entities(
            func.coalesce(models.Category.name, "Uncategorized"),
            func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0),
        )
        .group_by(func.coalesce(models.Category.name, "Uncategorized"))
        .all()
    )
    revenue_by_category = [
        {"category": row[0], "revenue": round(float(row[1] or 0), 2)} for row in cat_rows
    ]

    supplier_rows = (
        items.join(models.Product.supplier)  # Product already joined; adds User
        .with_entities(
            models.User.id,
            func.coalesce(models.User.company_name, models.User.full_name, models.User.email),
            func.coalesce(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity), 0.0),
            func.coalesce(func.sum(models.OrderItem.quantity), 0),
        )
        .group_by(models.User.id, func.coalesce(models.User.company_name, models.User.full_name, models.User.email))
        .order_by(func.sum(models.OrderItem.unit_price * models.OrderItem.quantity).desc())
        .limit(6)
        .all()
    )
    top_suppliers = [
        {
            "supplier_id": row.id,
            "name": row[1],
            "revenue": round(float(row[2] or 0), 2),
            "units_sold": int(row[3] or 0),
        }
        for row in supplier_rows
    ]

    status_rows = (
        orders_q.with_entities(models.Order.status, func.count(models.Order.id))
        .group_by(models.Order.status)
        .all()
    )
    orders_by_status = [
        {"status": (row[0].value if row[0] else "pending"), "count": int(row[1] or 0)} for row in status_rows
    ]

    return {
        "revenue_by_category": revenue_by_category,
        "top_suppliers": top_suppliers,
        "orders_by_status": orders_by_status,
    }
