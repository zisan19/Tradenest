import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from .database import engine, Base
from .migrations import run_lightweight_migrations
from .routers import users, products, categories, orders, auth as auth_router, dashboard, cart, payments, supplier, admin
from .sample_data import create_sample_data

load_dotenv()

app = FastAPI(title='TradeNest API', version='0.1')


def _upload_dir() -> str:
    """Uploads folder (overridable via UPLOAD_DIR env var)."""
    return os.getenv('UPLOAD_DIR', 'uploads')

# Create DB tables if needed
Base.metadata.create_all(bind=engine)


# Alias kept for the startup hook below.
_run_lightweight_migrations = run_lightweight_migrations

frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')

allowed_origins = list(set([
    frontend_origin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(cart.router)
app.include_router(payments.router)
app.include_router(supplier.router)
app.include_router(admin.router)

# Product images uploaded by suppliers are stored on disk (backend/uploads)
# and served at /uploads/<uuid>.<ext>.
os.makedirs(_upload_dir(), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_upload_dir())), name="uploads")

@app.get('/')
def root():
    return {"message": "Welcome to TradeNest API"}

@app.on_event('startup')
def startup_event():
    try:
        _run_lightweight_migrations()
    except Exception as e:
        print('Migration error:', e)
    try:
        create_sample_data()
    except Exception as e:
        print('Error creating sample data:', e)
