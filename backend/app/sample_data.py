from .database import engine
from . import models, auth
from sqlalchemy.orm import Session


def create_sample_data():
    db = Session(bind=engine)
    if db.query(models.User).first():
        print('Sample data already present')
        return

    admin = models.User(
        email='admin@tradenest.com',
        full_name='Admin',
        hashed_password=auth.get_password_hash('adminpass'),
        role='admin',
        is_verified=True,
    )
    supplier = models.User(
        email='supplier@tradenest.com',
        full_name='Acme Supplies',
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
    db.add_all([admin, supplier, buyer])
    db.commit()

    cat1 = models.Category(name='Electronics', slug='electronics', icon='⚡', description='Electrical and electronic goods')
    cat2 = models.Category(name='Home & Kitchen', slug='home-kitchen', icon='🏺', description='Household and hospitality products')
    cat3 = models.Category(name='Industrial Supplies', slug='industrial-supplies', icon='🔧', description='Machinery and factory essentials')
    db.add_all([cat1, cat2, cat3])
    db.commit()

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
    ]
    db.add_all(products)
    db.commit()
    print('Sample data created')
