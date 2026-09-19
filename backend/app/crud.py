from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from . import models, schemas, auth
from typing import List

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

def create_product(db: Session, product: schemas.ProductCreate, supplier_id: int):
    p = models.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        moq=product.moq,
        stock=product.stock,
        image_url=product.image_url,
        category_id=product.category_id,
        supplier_id=supplier_id,
        is_approved=True,
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


def update_product(db: Session, product_id: int, data: dict):
    p = get_product(db, product_id)
    if not p:
        return None
    for k, v in data.items():
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
