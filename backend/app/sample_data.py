"""Demo data loader for TradeNest.

Creates a small but realistic demo dataset on first boot (or via
`python seed_demo.py`):
- 1 admin, 2 approved suppliers (one with a full store profile), 1 buyer
- 1 PENDING-APPROVAL supplier (demo queue for the admin dashboard)
- 6 approved products, 1 pending-approval product
- A spread of orders across the last 10 days with mixed statuses so the
  dashboards' charts, trend lines and KPI cards have real data to show.

The loader is idempotent: existing rows are never overwritten.
"""
from datetime import datetime, timedelta

from .database import engine
from . import models, auth
from sqlalchemy.orm import Session


def create_sample_data():
    db = Session(bind=engine)
    try:
        if db.query(models.User).first():
            print('Sample data already present')
            return

        # ------------------------------------------------------------------
        # Users
        # ------------------------------------------------------------------
        admin = models.User(
            email='admin@tradenest.com',
            full_name='TradeNest Admin',
            hashed_password=auth.get_password_hash('adminpass'),
            role='admin',
            is_verified=True,
        )
        supplier = models.User(
            email='supplier@tradenest.com',
            full_name='Acme Supplies',
            company_name='Acme Supplies Ltd.',
            contact_phone='+1-555-0100',
            store_description='Trusted wholesale partner for electronics and accessories since 2015.',
            hashed_password=auth.get_password_hash('supplierpass'),
            role='supplier',
            is_verified=True,
        )
        buyer = models.User(
            email='buyer@tradenest.com',
            full_name='Buyer One',
            hashed_password=auth.get_password_hash('buyerpass'),
            role='buyer',
            is_verified=True,
        )
        supplier2 = models.User(
            email='global@tradenest.com',
            full_name='Global Home Goods',
            company_name='Global Home Goods Co.',
            contact_phone='+1-555-0142',
            store_description='Kitchen, dining and hospitality equipment at factory-direct prices.',
            hashed_password=auth.get_password_hash('globalpass'),
            role='supplier',
            is_verified=True,
        )
        pending_supplier = models.User(
            email='newcraft@tradenest.com',
            full_name='NewCraft Artisans',
            company_name='NewCraft Artisans Ltd.',
            contact_phone='+1-555-0177',
            store_description='Handmade home décor awaiting TradeNest verification.',
            hashed_password=auth.get_password_hash('newcraftpass'),
            role='supplier',
            is_verified=False,
            is_approved=False,  # <-- appears in the admin approval queue
        )
        db.add_all([admin, supplier, buyer, supplier2, pending_supplier])
        db.commit()

        # ------------------------------------------------------------------
        # Categories
        # ------------------------------------------------------------------
        cat1 = models.Category(name='Electronics', slug='electronics', icon='⚡', color_tag='#6366f1', description='Electrical and electronic goods')
        cat2 = models.Category(name='Home & Kitchen', slug='home-kitchen', icon='🏺', color_tag='#f59e0b', description='Household and hospitality products')
        cat3 = models.Category(name='Industrial Supplies', slug='industrial-supplies', icon='🔧', color_tag='#0ea5e9', description='Machinery and factory essentials')
        db.add_all([cat1, cat2, cat3])
        db.commit()

        # ------------------------------------------------------------------
        # Products (approved suppliers get approved listings)
        # ------------------------------------------------------------------
        products = [
            models.Product(
                name='Bulk USB Cable',
                description='High quality braided USB cables for retail and wholesale orders.',
                price=2.5,
                moq=50,
                stock=500,
                image_url='https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
                category_id=cat1.id,
                supplier_id=supplier.id,
                is_approved=True,
            ),
            models.Product(
                name='Stainless Steel Spoon (pack of 100)',
                description='Durable spoons ready for restaurant and hotel procurement bundles.',
                price=0.8,
                moq=100,
                stock=1000,
                image_url='https://images.unsplash.com/photo-1511689660979-1abfb7a7a8fb?auto=format&fit=crop&w=900&q=80',
                category_id=cat2.id,
                supplier_id=supplier.id,
                is_approved=True,
            ),
            models.Product(
                name='Commercial LED Panel Light',
                description='Energy-saving LED panels designed for factories and office spaces.',
                price=18.0,
                moq=20,
                stock=250,
                image_url='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
                category_id=cat3.id,
                supplier_id=supplier.id,
                is_approved=True,
            ),
            models.Product(
                name='Wireless Barcode Scanner',
                description='Reliable warehouse and retail scanning hardware.',
                price=42.0,
                moq=10,
                stock=120,
                image_url='https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
                category_id=cat1.id,
                supplier_id=supplier.id,
                is_approved=True,
            ),
            models.Product(
                name='Stackable Storage Bins',
                description='Clear stackable bins for backroom inventory organization.',
                price=8.75,
                moq=30,
                stock=8,  # deliberately low stock to demo the amber/red badges
                image_url='https://images.unsplash.com/photo-1606913079621-e64bd4c7b0e4?auto=format&fit=crop&w=900&q=80',
                category_id=cat2.id,
                supplier_id=supplier2.id,
                is_approved=True,
            ),
            models.Product(
                name='Recycled Mailer Boxes',
                description='Strong recyclable boxes for growing ecommerce teams.',
                price=1.35,
                moq=100,
                stock=2000,
                image_url='https://images.unsplash.com/photo-1586528116493-da8b6f5b4b1d?auto=format&fit=crop&w=900&q=80',
                category_id=cat3.id,
                supplier_id=supplier2.id,
                is_approved=True,
            ),
            # Pending-approval listing for the admin review queue
            models.Product(
                name='Handwoven Cotton Throw',
                description='Artisan handwoven throws awaiting TradeNest approval.',
                price=11.4,
                moq=25,
                stock=300,
                image_url='https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',
                category_id=cat2.id,
                supplier_id=pending_supplier.id,
                is_approved=False,
                rejection_reason=None,
            ),
        ]
        db.add_all(products)
        db.commit()

        # ------------------------------------------------------------------
        # Orders: spread over the last 10 days with mixed statuses
        # ------------------------------------------------------------------
        now = datetime.utcnow()
        order_specs = [
            (products[0], 100, 'delivered', 9),
            (products[2], 40, 'delivered', 7),
            (products[4], 50, 'shipped', 5),
            (products[1], 200, 'confirmed', 3),
            (products[3], 12, 'shipped', 2),
            (products[5], 400, 'pending', 1),
            (products[2], 25, 'pending', 0),
            (products[0], 60, 'confirmed', 0),
        ]
        for product, quantity, status_name, days_ago in order_specs:
            order = models.Order(
                buyer_id=buyer.id,
                total=product.price * quantity,
                status=models.OrderStatus(status_name),
                created_at=now - timedelta(days=days_ago),
            )
            order.items.append(
                models.OrderItem(
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price,
                )
            )
            db.add(order)
        db.commit()
        print('Sample data created')
    finally:
        db.close()
