from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
import datetime
import json

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
    color_tag: Optional[str] = None

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
    short_description: Optional[str] = None
    unit: str = "piece"
    tags: List[str] = []
    image_urls: List[str] = []
    is_approved: bool = True
    is_active: bool = True
    is_draft: bool = False
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True

    @field_validator("tags", mode="before")
    @classmethod
    def _tags_from_orm(cls, v):
        """ORM stores tags as a comma-separated string — parse it for output."""
        return _split_csv(v)

    @field_validator("image_urls", mode="before")
    @classmethod
    def _images_from_orm(cls, v):
        """ORM stores the gallery as a JSON string — parse it for output."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except (TypeError, ValueError):
                return []
        return v or []


# --- Supplier / Admin dashboard schemas -------------------------------------

class ProductUpdate(BaseModel):
    """Partial update payload for a product. All fields optional."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    moq: Optional[int] = Field(default=None, ge=1)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


ALLOWED_UNITS = {"piece", "box", "kg", "carton", "set", "pack", "pallet"}


def _split_csv(value):
    """Normalize tags given as list / comma-string / None into a clean list."""
    if value is None or value == "":
        return []
    if isinstance(value, str):
        parts = value.split(",")
    else:
        parts = list(value)
    return [p.strip() for p in parts if p and p.strip()]


class _ProductFormMixin:
    """Shared normalization for the rich product form payloads.

    Plain mixin (not a BaseModel) so Pydantic only collects the validators
    once the concrete model declares the fields.
    """

    @field_validator("tags", mode="before")
    @classmethod
    def _normalize_tags(cls, v):
        return _split_csv(v)

    @field_validator("image_urls", mode="before")
    @classmethod
    def _normalize_images(cls, v):
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except (TypeError, ValueError):
                v = [u for u in (s.strip() for s in v.split(",")) if u]
        if v is None:
            return []
        return [str(u).strip() for u in v if str(u).strip()]

    @field_validator("short_description")
    @classmethod
    def _short_desc_limit(cls, v):
        if v and len(v) > 150:
            raise ValueError("short_description must be at most 150 characters")
        return v

    @field_validator("unit")
    @classmethod
    def _unit_allowed(cls, v):
        if v is not None and str(v).lower() not in ALLOWED_UNITS:
            raise ValueError(f"unit must be one of: {', '.join(sorted(ALLOWED_UNITS))}")
        return str(v).lower() if v else v


class SupplierProductCreate(_ProductFormMixin, BaseModel):
    """Create payload for the supplier Add-Product form.

    Submissions (`is_draft=False`) enforce the quality rules: title 3-100
    chars, description 50-2000 chars, price > 0, moq >= 1, stock >= 0.
    Drafts (`is_draft=True`) only need a title — everything else is filled
    with safe defaults so suppliers can save work in progress.
    """
    name: str = Field(..., min_length=1, max_length=100)
    short_description: Optional[str] = None
    description: Optional[str] = None
    price: float = Field(default=0, ge=0)
    # ge=0 at field level so partial drafts (moq=0) reach the validator,
    # which defaults drafts to 1 and rejects submissions below 1.
    moq: int = Field(default=1, ge=0, le=100000)
    stock: int = Field(default=0, ge=0)
    unit: str = Field(default="piece")
    tags: List[str] = []
    image_url: Optional[str] = None
    image_urls: List[str] = []
    category_id: Optional[int] = None
    is_draft: bool = False

    @model_validator(mode="after")
    def _apply_quality_rules(self):
        if not self.is_draft:
            # Full submission: enforce every quality bar.
            if len(self.name.strip()) < 3:
                raise ValueError("Product title must be at least 3 characters")
            desc = (self.description or "").strip()
            if len(desc) < 50:
                raise ValueError("Description must be at least 50 characters for submissions")
            if len(desc) > 2000:
                raise ValueError("Description must be at most 2000 characters")
            if self.price <= 0:
                raise ValueError("Price must be greater than 0")
            if self.moq < 1:
                raise ValueError("MOQ must be at least 1")
            if self.stock < 0:
                raise ValueError("Stock cannot be negative")
        else:
            # Draft: tolerate partial data with safe column defaults.
            self.description = (self.description or "").strip()
            self.price = float(self.price or 0)
            self.moq = int(self.moq or 1)
            self.stock = int(self.stock or 0)
        # Keep image_url (used by the public card) in sync with image_urls[0].
        if not self.image_url and self.image_urls:
            self.image_url = self.image_urls[0]
        return self


class SupplierProductUpdate(_ProductFormMixin, BaseModel):
    """Partial edit payload.

    Field constraints are intentionally loose here (no min_length at the
    field level) so draft saves with partial data pass; the model validator
    enforces the quality rules only for full submissions / live products.
    """
    name: Optional[str] = Field(default=None, max_length=100)
    short_description: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    moq: Optional[int] = Field(default=None, ge=1, le=100000)
    stock: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = None
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    category_id: Optional[int] = None
    is_draft: Optional[bool] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def _apply_quality_rules(self):
        # Draft saves (is_draft=True in payload OR target stays a draft) skip
        # the quality bars; everything else is enforced when fields present.
        if self.is_draft is not True:
            if self.name is not None and len(self.name.strip()) < 3:
                raise ValueError("Product title must be at least 3 characters")
            if self.description is not None and len(self.description.strip()) < 50:
                raise ValueError("Description must be at least 50 characters for submissions")
            if self.price is not None and self.price <= 0:
                raise ValueError("Price must be greater than 0")
        return self


class ImageUploadOut(BaseModel):
    """Result of a single image upload."""
    url: str
    filename: str
    size: int


class OrderItemDetail(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True
        orm_mode = True


class BuyerMini(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True
        orm_mode = True


class SupplierOrderOut(BaseModel):
    """Order enriched with buyer info + item detail for dashboard tables."""
    id: int
    buyer_id: int
    buyer: Optional[BuyerMini] = None
    total: float
    status: str
    items: List[OrderItemDetail] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True
        orm_mode = True


class OrderStatusUpdate(BaseModel):
    status: str


class RecentOrderOut(BaseModel):
    id: int
    buyer_name: Optional[str] = None
    total: float
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
        orm_mode = True


class TrendPoint(BaseModel):
    label: str
    revenue: float
    orders: int


class SupplierStatsOut(BaseModel):
    total_products: int
    total_active_products: int
    total_orders: int
    total_revenue: float
    total_units_sold: int
    pending_orders: int
    revenue_change_pct: Optional[float] = None
    orders_change_pct: Optional[float] = None
    recent_orders: List[RecentOrderOut] = []
    revenue_trend: List[TrendPoint] = []


class StatusCount(BaseModel):
    status: str
    count: int


class BestSellingProduct(BaseModel):
    product_id: int
    name: str
    units_sold: int
    revenue: float


class SupplierAnalyticsOut(BaseModel):
    range: str
    best_selling: List[BestSellingProduct] = []
    orders_by_status: List[StatusCount] = []
    revenue_by_category: List[dict] = []


class SupplierProfileOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    contact_phone: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None
    is_verified: bool
    is_approved: bool
    role: str

    class Config:
        from_attributes = True
        orm_mode = True


class SupplierProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    full_name: Optional[str] = None
    contact_phone: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None


class PaginatedSupplierProducts(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# --- Admin schemas -----------------------------------------------------------

class AdminUserOut(UserOut):
    company_name: Optional[str] = None
    is_approved: bool = True


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


class RejectRequest(BaseModel):
    reason: Optional[str] = None


class PendingSupplierOut(UserOut):
    company_name: Optional[str] = None
    is_approved: bool = True
    product_count: int = 0
    pending_product_count: int = 0


class PendingProductOut(ProductOut):
    supplier_name: Optional[str] = None
    supplier_company: Optional[str] = None


class AdminStatsOut(BaseModel):
    total_users: int
    total_buyers: int
    total_suppliers: int
    total_admins: int
    total_products: int
    total_active_products: int
    pending_products: int
    pending_suppliers: int
    total_orders: int
    total_revenue: float
    recent_signups: List[AdminUserOut] = []
    recent_orders: List[RecentOrderOut] = []
    revenue_trend: List[TrendPoint] = []
    signup_trend: List[dict] = []


class AdminOrderOut(SupplierOrderOut):
    supplier_names: List[str] = []

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
