from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: Optional[str] = "buyer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    role: str
    is_verified: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
        orm_mode = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserOut] = None

class TokenRefresh(BaseModel):
    refresh_token: str

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True
        orm_mode = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    moq: int
    stock: int
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    supplier_id: Optional[int]
    category: Optional[CategoryOut]

    class Config:
        from_attributes = True
        orm_mode = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True
        orm_mode = True

class OrderOut(BaseModel):
    id: int
    buyer_id: int
    total: float
    status: str
    items: List[OrderItemOut]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
        orm_mode = True


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: int
    cart_id: int
    product_id: int
    quantity: int
    price_snapshot: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True
        orm_mode = True


class CartOut(BaseModel):
    id: int
    buyer_id: int
    items: List[CartItemOut] = []
    total_items: int = 0
    subtotal: float = 0.0
    created_at: datetime.datetime

    class Config:
        from_attributes = True
        orm_mode = True


class PaymentSimulateRequest(BaseModel):
    order_id: int
    method: str = "card"
    simulate_failure: bool = False
    card_last_four: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    order_id: int
    method: str
    amount: float
    currency: str
    status: str
    transaction_ref: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
        orm_mode = True
