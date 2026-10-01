import enum
import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from .database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    # Suppliers require an explicit admin approval before they can trade.
    # Buyers/admins default to approved so existing flows are unaffected.
    is_approved = Column(Boolean, default=True)
    role = Column(String, default="buyer")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(DateTime, nullable=True)
    # Supplier store / profile settings (also reusable for other roles).
    company_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    store_description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)

    products = relationship("Product", back_populates="supplier")
    orders = relationship("Order", back_populates="buyer")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    icon = Column(String, nullable=True)
    color_tag = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    # One-line blurb shown on product cards (optional, max 150 chars).
    short_description = Column(String(200), nullable=True)
    price = Column(Float, nullable=False)
    moq = Column(Integer, default=1)
    stock = Column(Integer, default=0)
    # Unit the price refers to: "piece", "box", "kg", "carton", "set", ...
    unit = Column(String(20), default="piece", nullable=False)
    # Comma-separated search keywords ("usb,cable,braided").
    tags = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    # JSON-encoded array of image paths (returned pre-parsed by the schemas).
    image_urls = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    supplier_id = Column(Integer, ForeignKey("users.id"))
    is_approved = Column(Boolean, default=True)
    # Draft flag: saved locally but not yet submitted for admin review.
    is_draft = Column(Boolean, default=False)
    # Soft-delete / delist flag. Inactive products stay in the database but are
    # hidden from the public marketplace and can be re-activated by the owner.
    is_active = Column(Boolean, default=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow,
                        onupdate=datetime.datetime.utcnow)

    category = relationship("Category", back_populates="products")
    supplier = relationship("User", back_populates="products")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    total = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    buyer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)

    user = relationship("User")


class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    buyer = relationship("User")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_snapshot = Column(Float, nullable=False)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    method = Column(String, nullable=False)  # "card", "mobile_banking", "cash_on_delivery"
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    transaction_ref = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order")


class AuditLog(Base):
    """Lightweight admin audit trail: who did what, to which resource, and when.

    Kept intentionally simple (no joins required) so it stays cheap to write from
    any privileged endpoint. `target_type`/`target_id` identify the affected row.
    """

    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g. "approve_supplier", "suspend_user"
    target_type = Column(String, nullable=False)  # "user", "product", "category", ...
    target_id = Column(Integer, nullable=True)
    detail = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    admin = relationship("User")
