"""Seed repeatable demo data for local TradeNest development.

Run from the backend directory:
    python seed_demo.py
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


USERS = [
    {
        "email": "admin@tradenest.com",
        "full_name": "TradeNest Admin",
        "password": "adminpass",
        "role": "admin",
    },
    {
        "email": "supplier@tradenest.com",
        "full_name": "Acme Supplies",
        "password": "supplierpass",
        "role": "supplier",
    },
    {
        "email": "buyer@tradenest.com",
        "full_name": "Northstar Retail",
        "password": "buyerpass",
        "role": "buyer",
    },
]

CATEGORIES = [
    ("Electronics", "electronics", "Electrical and electronic goods", "⚡"),
    ("Home & Kitchen", "home-kitchen", "Household and hospitality products", "🏺"),
    ("Industrial Supplies", "industrial-supplies", "Machinery and factory essentials", "🔧"),
    ("Packaging", "packaging", "Retail and shipping packaging essentials", "□"),
]

PRODUCTS = [
    ("Bulk USB-C Cable", "Braided USB-C cables prepared for retail bundles.", 2.50, 50, 500, "electronics"),
    ("Commercial LED Panel Light", "Energy-saving LED panels for offices and factories.", 18.00, 20, 250, "industrial-supplies"),
    ("Wireless Barcode Scanner", "Reliable warehouse and retail scanning hardware.", 42.00, 10, 120, "electronics"),
    ("Stainless Steel Utensil Set", "Durable utensil sets for restaurant procurement.", 12.80, 25, 300, "home-kitchen"),
    ("Recycled Mailer Boxes", "Strong recyclable boxes for growing ecommerce teams.", 1.35, 100, 2000, "packaging"),
    ("Stackable Storage Bins", "Clear stackable bins for backroom inventory organization.", 8.75, 30, 450, "home-kitchen"),
]

IMAGE_URLS = [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1511689660979-1abfb7a7a8fb?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1586528116493-da8b6f5b4b1d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1606913079621-e64bd4c7b0e4?auto=format&fit=crop&w=900&q=80",
]


def get_or_create_user(db: Session, item: dict) -> models.User:
    user = db.query(models.User).filter(models.User.email == item["email"]).first()
    if user:
        return user
    user = models.User(
        email=item["email"],
        full_name=item["full_name"],
        hashed_password=auth.get_password_hash(item["password"]),
        role=item["role"],
        is_verified=True,
    )
    db.add(user)
    db.flush()
    return user


def seed_demo_data() -> None:
    # The application creates tables on startup; this keeps the standalone script usable by itself.
    models.Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        users = {item["role"]: get_or_create_user(db, item) for item in USERS}
        categories = {}
        for name, slug, description, icon in CATEGORIES:
            category = db.query(models.Category).filter(models.Category.slug == slug).first()
            if not category:
                category = models.Category(name=name, slug=slug, description=description, icon=icon)
                db.add(category)
                db.flush()
            categories[slug] = category

        products = []
        for index, (name, description, price, moq, stock, category_slug) in enumerate(PRODUCTS):
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
                    supplier_id=users["supplier"].id,
                    is_approved=True,
                )
                db.add(product)
                db.flush()
            products.append(product)

        if not db.query(models.Order).first():
            first_order = models.Order(
                buyer_id=users["buyer"].id,
                total=products[0].price * products[0].moq,
                status=models.OrderStatus.delivered,
                created_at=datetime.utcnow() - timedelta(days=8),
            )
            first_order.items.append(models.OrderItem(product_id=products[0].id, quantity=products[0].moq, unit_price=products[0].price))
            second_order = models.Order(
                buyer_id=users["buyer"].id,
                total=products[1].price * products[1].moq,
                status=models.OrderStatus.pending,
                created_at=datetime.utcnow() - timedelta(days=2),
            )
            second_order.items.append(models.OrderItem(product_id=products[1].id, quantity=products[1].moq, unit_price=products[1].price))
            db.add_all([first_order, second_order])

        db.commit()
        print(f"Demo data ready: {len(users)} users, {len(categories)} categories, {len(products)} products, {db.query(models.Order).count()} orders")


if __name__ == "__main__":
    seed_demo_data()
