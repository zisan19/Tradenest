import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import engine, Base
from .routers import users, products, categories, orders, auth as auth_router, dashboard, cart, payments
from .sample_data import create_sample_data

load_dotenv()

app = FastAPI(title='TradeNest API', version='0.1')

# Create DB tables if needed
Base.metadata.create_all(bind=engine)

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

@app.get('/')
def root():
    return {"message": "Welcome to TradeNest API"}

@app.on_event('startup')
def startup_event():
    try:
        create_sample_data()
    except Exception as e:
        print('Error creating sample data:', e)
