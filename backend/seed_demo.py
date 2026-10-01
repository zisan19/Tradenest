"""Seed repeatable demo data for local TradeNest development.

Run from the backend directory:
    python seed_demo.py

Idempotent: creates missing users/categories/products/orders without
overwriting existing records. Includes a pending-approval supplier and product
so the admin approval queue can be demonstrated immediately.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
import sys

from sqlalchemy.orm import Session

# Allow `python seed_demo.py` to import the local app package.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import auth, models
from app.database import engine
from app.migrations import run_lightweight_migrations


USERS = [
    {
        "email": "admin@tradenest.com",
        "full_name": "TradeNest Admin",
        "password": "adminpass",
        "role": "admin",
        "approved": True,
    },
    {
        "email": "supplier@tradenest.com",
        "full_name": "Acme Supplies",
        "password": "supplierpass",
        "role": "supplier",
        "approved": True,
        "company_name": "Acme Supplies Ltd.",
        "contact_phone": "+1-555-0100",
        "store_description": "Trusted wholesale partner for electronics and accessories since 2015.",
    },
    {
        "email": "buyer@tradenest.com",
        "full_name": "Northstar Retail",
        "password": "buyerpass",
        "role": "buyer",
        "approved": True,
    },
    {
        "email": "global@tradenest.com",
        "full_name": "Global Home Goods",
        "password": "globalpass",
        "role": "supplier",
        "approved": True,
        "company_name": "Global Home Goods Co.",
        "contact_phone": "+1-555-0142",
        "store_description": "Kitchen, dining and hospitality equipment at factory-direct prices.",
    },
    # Demo item for the admin Supplier Approval queue
    {
        "email": "newcraft@tradenest.com",
        "full_name": "NewCraft Artisans",
        "password": "newcraftpass",
        "role": "supplier",
        "approved": False,
        "company_name": "NewCraft Artisans Ltd.",
        "contact_phone": "+1-555-0177",
        "store_description": "Handmade home décor awaiting TradeNest verification.",
    },
]

CATEGORIES = [
    ("Electronics", "electronics", "Electrical and electronic goods", "⚡", "#6366f1"),
    ("Home & Kitchen", "home-kitchen", "Household and hospitality products", "🏺", "#f59e0b"),
    ("Industrial Supplies", "industrial-supplies", "Machinery and factory essentials", "🔧", "#0ea5e9"),
    ("Packaging", "packaging", "Retail and shipping packaging essentials", "📦", "#10b981"),
]

# (name, description, price, moq, stock, category_slug, owner_role, approved)
PRODUCTS = [
    ("Bulk USB-C Cable", "Braided USB-C cables prepared for retail bundles.", 2.50, 50, 500, "electronics", "supplier", True),
    ("Commercial LED Panel Light", "Energy-saving LED panels for offices and factories.", 18.00, 20, 250, "industrial-supplies", "supplier", True),
    ("Wireless Barcode Scanner", "Reliable warehouse and retail scanning hardware.", 42.00, 10, 120, "electronics", "supplier", True),
    ("Stainless Steel Utensil Set", "Durable utensil sets for restaurant procurement.", 12.80, 25, 300, "home-kitchen", "global", True),
    ("Recycled Mailer Boxes", "Strong recyclable boxes for growing ecommerce teams.", 1.35, 100, 2000, "packaging", "global", True),
    ("Stackable Storage Bins", "Clear stackable bins for backroom inventory organization.", 8.75, 30, 8, "home-kitchen", "global", True),
    # Pending-approval listing for the admin review queue
    ("Handwoven Cotton Throw", "Artisan handwoven throws awaiting TradeNest approval.", 11.40, 25, 300, "home-kitchen", "pending_supplier", False),
]

IMAGE_URLS = [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1511689660979-1abfb7a7a8fb?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1586528116493-da8b6f5b4b1d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1606913079621-e64bd4c7b0e4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
]

# (product_index, quantity, status, days_ago)
ORDERS = [
    (0, 100, "delivered", 9),
    (1, 40, "delivered", 7),
    (4, 50, "shipped", 5),
    (3, 200, "confirmed", 3),
    (2, 12, "shipped", 2),
    (5, 400, "pending", 1),
    (1, 25, "pending", 0),
    (0, 60, "confirmed", 0),
]


def get_or_create_user(db: Session, item: dict) -> models.User:
    user = db.query(models.User).filter(models.User.email == item["email"]).first()
    if user:
        return user
    approved = item.get("approved", True)
    user = models.User(
        email=item["email"],
        full_name=item["full_name"],
        hashed_password=auth.get_password_hash(item["password"]),
        role=item["role"],
        is_verified=approved,
        is_approved=approved,
        company_name=item.get("company_name"),
        contact_phone=item.get("contact_phone"),
        store_description=item.get("store_description"),
    )
    db.add(user)
    db.flush()
    return user


def seed_demo_data() -> None:
    # The application creates tables on startup; this keeps the standalone script usable by itself.
    models.Base.metadata.create_all(bind=engine)
    # Add dashboard-era columns to pre-existing local databases.
    run_lightweight_migrations()
    with Session(bind=engine) as db:
        users = {self_key(item): get_or_create_user(db, item) for item in USERS}
        categories = {}
        for name, slug, description, icon, color in CATEGORIES:
            category = db.query(models.Category).filter(models.Category.slug == slug).first()
            if not category:
                category = models.Category(name=name, slug=slug, description=description, icon=icon, color_tag=color)
                db.add(category)
                db.flush()
            categories[slug] = category

        products = []
        for index, (name, description, price, moq, stock, category_slug, owner_key, approved) in enumerate(PRODUCTS):
            product = db.query(models.Product).filter(models.Product.name == name).first()
            if not product:
                product = models.Product(
                    name=name,
                    description=description,
                    price=price,
                    moq=moq,
                    stock=stock,
                    image_url=IMAGE_URLS[index],
                    category_id=categories[category_slug].id,
                    supplier_id=users[owner_key].id,
                    is_approved=approved,
                )
                db.add(product)
                db.flush()
            products.append(product)

        if not db.query(models.Order).first():
            for product_index, quantity, status_name, days_ago in ORDERS:
                product = products[product_index]
                order = models.Order(
                    buyer_id=users["buyer"].id,
                    total=product.price * quantity,
                    status=models.OrderStatus(status_name),
                    created_at=datetime.utcnow() - timedelta(days=days_ago),
                )
                order.items.append(
                    models.OrderItem(product_id=product.id, quantity=quantity, unit_price=product.price)
                )
                db.add(order)

        db.commit()
        print(
            f"Demo data ready: {db.query(models.User).count()} users, "
            f"{db.query(models.Category).count()} categories, "
            f"{db.query(models.Product).count()} products, "
            f"{db.query(models.Order).count()} orders "
            f"({db.query(models.Product).filter(models.Product.is_approved == False).count()} pending products, "
            f"{db.query(models.User).filter(models.User.role == 'supplier', models.User.is_approved == False).count()} pending suppliers)"
        )


def self_key(item: dict) -> str:
    """Map a seeded user to the key used by PRODUCTS/ORDERS specs."""
    if item["role"] == "admin":
        return "admin"
    if item["role"] == "buyer":
        return "buyer"
    if not item.get("approved", True):
        return "pending_supplier"
    return item["email"].split("@")[0] if item["email"] != "supplier@tradenest.com" else "supplier"


if __name__ == "__main__":
    seed_demo_data()
