import os

import time

import json

import base64

import hashlib

import hmac

import secrets

from fastapi import FastAPI, Depends, HTTPException, Header

from fastapi.middleware.cors import CORSMiddleware


from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from pydantic import BaseModel,Field

from typing import List,Optional

from datetime import datetime

from database import SessionLocal, engine, Base

from models import Product, Customer, CustomerAddress, Order, OrderItem

# =========================================================

# APP

# =========================================================

app = FastAPI(title="Beervana API")
security = HTTPBearer()

# =========================================================

# CREATE DATABASE TABLES

# =========================================================

Base.metadata.create_all(bind=engine)

# =========================================================

# CORS

# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

# =========================================================

# DATABASE CONNECTION

# =========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()

# =========================================================

# ORDER SCHEMAS

# =========================================================

class OrderItemRequest(BaseModel):

    product_id: int

    quantity: int

class OrderRequest(BaseModel):

    customer_name: str

    phone: str

    address: str

    city: str

    pincode: str

    payment_method: str

    delivery_option: str = "standard"

    items: List[OrderItemRequest]

# =========================================================

# HOME API

# =========================================================

@app.get("/")

def home():

    return {

        "message": "Welcome to Beervana API!"

    }

# =========================================================

# GET ALL PRODUCTS

# =========================================================

@app.get("/products")

def get_products(

    db: Session = Depends(get_db)

):

    products = db.query(Product).all()

    return [

        {

            "id": product.id,

            "name": product.name,

            "category": product.category,

            "description": product.description,

            "price": product.price,

            "image": product.image,

            "stock": product.stock,

        }

        for product in products

    ]

# =========================================================

# CREATE ORDER

# =========================================================

@app.post("/orders")

def create_order(

    order_data: OrderRequest,

    db: Session = Depends(get_db)

):

    # -----------------------------------------------------

    # CHECK CART

    # -----------------------------------------------------

    if not order_data.items:

        raise HTTPException(

            status_code=400,

            detail="Cart is empty."

        )

    # -----------------------------------------------------

    # CHECK PHONE

    # -----------------------------------------------------

    if (

        not order_data.phone.isdigit()

        or len(order_data.phone) != 10

    ):

        raise HTTPException(

            status_code=400,

            detail="Invalid phone number."

        )

    # -----------------------------------------------------

    # CHECK PINCODE

    # -----------------------------------------------------

    if (

        not order_data.pincode.isdigit()

        or len(order_data.pincode) != 6

    ):

        raise HTTPException(

            status_code=400,

            detail="Invalid pincode."

        )

    # -----------------------------------------------------

    # CHECK PAYMENT METHOD

    # -----------------------------------------------------

    allowed_payment_methods = [

        "cod",

        "upi",

        "card"

    ]

    if (

        order_data.payment_method

        not in allowed_payment_methods

    ):

        raise HTTPException(

            status_code=400,

            detail="Invalid payment method."

        )

    # -----------------------------------------------------

    # CALCULATE SUBTOTAL

    # -----------------------------------------------------

    subtotal = 0

    order_items_data = []

    # -----------------------------------------------------

    # CHECK PRODUCTS + STOCK

    # -----------------------------------------------------

    for item in order_data.items:

        # Quantity check

        if item.quantity <= 0:

            raise HTTPException(

                status_code=400,

                detail="Invalid product quantity."

            )

        # Find product

        product = db.query(Product).filter(

            Product.id == item.product_id

        ).first()

        # Product not found

        if not product:

            raise HTTPException(

                status_code=404,

                detail=(

                    f"Product {item.product_id} "

                    f"not found."

                )

            )

        # -------------------------------------------------

        # STOCK CHECK

        # -------------------------------------------------

        if item.quantity > product.stock:

            raise HTTPException(

                status_code=400,

                detail=(

                    f"Not enough stock for "

                    f"{product.name}. "

                    f"Available stock: "

                    f"{product.stock}"

                )

            )

        # -------------------------------------------------

        # ITEM SUBTOTAL

        # -------------------------------------------------

        item_subtotal = (

            float(product.price)

            * item.quantity

        )

        subtotal += item_subtotal

        order_items_data.append(

            {

                "product": product,

                "quantity": item.quantity,

                "subtotal": item_subtotal,

            }

        )

    # =====================================================

    # DELIVERY CHARGE

    # =====================================================

    # Below ₹499 = ₹40

    # ₹499 or above = FREE

    if subtotal >= 499:

        delivery_fee = 0

    else:

        delivery_fee = 40

    # =====================================================

    # GRAND TOTAL

    # =====================================================

    total_amount = (

        subtotal

        + delivery_fee

    )

    # =====================================================

    # GENERATE ORDER ID

    # =====================================================

    timestamp = datetime.now().strftime(

        "%Y%m%d%H%M%S"

    )

    order_id = f"BVN-{timestamp}"

    # =====================================================

    # CREATE ORDER

    # =====================================================

    new_order = Order(

        order_id=order_id,

        customer_name=(

            order_data.customer_name

        ),

        phone=(

            order_data.phone

        ),

        address=(

            order_data.address

        ),

        city=(

            order_data.city

        ),

        pincode=(

            order_data.pincode

        ),

        payment_method=(

            order_data.payment_method

        ),

        delivery_option=(

            order_data.delivery_option

        ),

        subtotal=subtotal,

        delivery_fee=delivery_fee,

        total_amount=total_amount,

        status="Pending"

    )

    # Add order

    db.add(new_order)

    # Get database ID

    db.flush()

    # =====================================================

    # CREATE ORDER ITEMS

    # =====================================================

    for item_data in order_items_data:

        product = item_data["product"]

        quantity = item_data["quantity"]

        item_subtotal = item_data["subtotal"]

        # -----------------------------------------------

        # CREATE ORDER ITEM

        # -----------------------------------------------

        new_item = OrderItem(

            order_id=new_order.id,

            product_id=product.id,

            product_name=product.name,

            price=float(product.price),

            quantity=quantity,

            subtotal=item_subtotal

        )

        db.add(new_item)

        # -----------------------------------------------

        # REDUCE STOCK

        # -----------------------------------------------

        product.stock -= quantity

    # =====================================================

    # SAVE TO MYSQL

    # =====================================================

    try:

        db.commit()

    except Exception as e:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail=f"Failed to save order: {str(e)}"

        )

    # =====================================================

    # SUCCESS RESPONSE

    # =====================================================

    return {

        "success": True,

        "message": (

            "Order placed successfully!"

        ),

        "order_id": order_id,

        "subtotal": round(

            subtotal,

            2

        ),

        "delivery_fee": delivery_fee,

        "total_amount": round(

            total_amount,

            2

        ),

        "status": "Pending"

    }

    # =========================================================

# TRACK ORDER

# =========================================================

@app.get("/orders/{order_id}")

def get_order(

    order_id: str,

    db: Session = Depends(get_db)

):

    # -----------------------------------------------------

    # FIND ORDER

    # -----------------------------------------------------

    order = db.query(Order).filter(

        Order.order_id == order_id

    ).first()

    # -----------------------------------------------------

    # ORDER NOT FOUND

    # -----------------------------------------------------

    if not order:

        raise HTTPException(

            status_code=404,

            detail="Order not found."

        )

    # -----------------------------------------------------

    # GET ORDER ITEMS

    # -----------------------------------------------------

    items = db.query(OrderItem).filter(

        OrderItem.order_id == order.id

    ).all()

    # -----------------------------------------------------

    # RETURN ORDER

    # -----------------------------------------------------

    return {

        "success": True,

        "order": {

            "order_id": order.order_id,

            "customer_name": order.customer_name,

            "phone": order.phone,

            "address": order.address,

            "city": order.city,

            "pincode": order.pincode,

            "payment_method": order.payment_method,

            "delivery_option": order.delivery_option,

            "subtotal": float(order.subtotal),

            "delivery_fee": float(order.delivery_fee),

            "total_amount": float(order.total_amount),

            "status": order.status,

            "created_at": (

                order.created_at.isoformat()

                if order.created_at

                else None

            ),

            "items": [

                {

                    "product_id": item.product_id,

                    "product_name": item.product_name,

                    "price": float(item.price),

                    "quantity": item.quantity,

                    "subtotal": float(item.subtotal)

                }

                for item in items

            ]

        }

    }

    # =========================================================

# ADMIN - GET ALL ORDERS

# =========================================================

@app.get("/admin/orders")

def get_all_orders(

    db: Session = Depends(get_db)

):

    orders = (

        db.query(Order)

        .order_by(Order.id.desc())

        .all()

    )

    result = []

    for order in orders:

        items = (

            db.query(OrderItem)

            .filter(OrderItem.order_id == order.id)

            .all()

        )

        result.append({

            "id": order.id,

            "order_id": order.order_id,

            "customer_name": order.customer_name,

            "phone": order.phone,

            "address": order.address,

            "city": order.city,

            "pincode": order.pincode,

            "payment_method": order.payment_method,

            "delivery_option": order.delivery_option,

            "subtotal": float(order.subtotal),

            "delivery_fee": float(order.delivery_fee),

            "total_amount": float(order.total_amount),

            "status": order.status,

            "created_at": (

                order.created_at.isoformat()

                if order.created_at

                else None

            ),

            "items": [

                {

                    "product_id": item.product_id,

                    "product_name": item.product_name,

                    "price": float(item.price),

                    "quantity": item.quantity,

                    "subtotal": float(item.subtotal),

                }

                for item in items

            ],

        })

    return {

        "success": True,

        "total_orders": len(result),

        "orders": result,

    }

# =========================================================

# ADMIN - UPDATE ORDER STATUS

# =========================================================

class OrderStatusRequest(BaseModel):

    status: str

@app.patch("/admin/orders/{order_id}/status")

def update_order_status(

    order_id: str,

    status_data: OrderStatusRequest,

    db: Session = Depends(get_db)

):

    allowed_statuses = [

        "Pending",

        "Confirmed",

        "Preparing",

        "Out for Delivery",

        "Delivered",

        "Cancelled",

    ]

    if status_data.status not in allowed_statuses:

        raise HTTPException(

            status_code=400,

            detail=(

                "Invalid status. Allowed statuses: "

                + ", ".join(allowed_statuses)

            ),

        )

    order = (

        db.query(Order)

        .filter(Order.order_id == order_id)

        .first()

    )

    if not order:

        raise HTTPException(

            status_code=404,

            detail="Order not found."

        )

    order.status = status_data.status

    try:

        db.commit()

        db.refresh(order)

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to update order status."

        )

    return {

        "success": True,

        "message": "Order status updated successfully.",

        "order_id": order.order_id,

        "status": order.status,

    }

    # =========================================================

# ADMIN - PRODUCT MANAGEMENT

# =========================================================

class ProductCreateRequest(BaseModel):

    name: str

    category: str

    description: str = ""

    price: float

    image: str = ""

    stock: int

class ProductUpdateRequest(BaseModel):

    name: str

    category: str

    description: str = ""

    price: float

    image: str = ""

    stock: int

# =========================================================

# ADMIN - GET ALL PRODUCTS

# =========================================================

@app.get("/admin/products")

def get_admin_products(

    db: Session = Depends(get_db)

):

    products = (

        db.query(Product)

        .order_by(Product.id.desc())

        .all()

    )

    return {

        "success": True,

        "total_products": len(products),

        "products": [

            {

                "id": product.id,

                "name": product.name,

                "category": product.category,

                "description": product.description,

                "price": float(product.price),

                "image": product.image,

                "stock": product.stock,

            }

            for product in products

        ],

    }

# =========================================================

# ADMIN - ADD PRODUCT

# =========================================================

@app.post("/admin/products")

def create_admin_product(

    product_data: ProductCreateRequest,

    db: Session = Depends(get_db)

):

    if not product_data.name.strip():

        raise HTTPException(

            status_code=400,

            detail="Product name is required."

        )

    if not product_data.category.strip():

        raise HTTPException(

            status_code=400,

            detail="Product category is required."

        )

    if product_data.price < 0:

        raise HTTPException(

            status_code=400,

            detail="Price cannot be negative."

        )

    if product_data.stock < 0:

        raise HTTPException(

            status_code=400,

            detail="Stock cannot be negative."

        )

    new_product = Product(

        name=product_data.name.strip(),

        category=product_data.category.strip(),

        description=product_data.description.strip(),

        price=product_data.price,

        image=product_data.image.strip(),

        stock=product_data.stock,

    )

    try:

        db.add(new_product)

        db.commit()

        db.refresh(new_product)

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to create product."

        )

    return {

        "success": True,

        "message": "Product created successfully.",

        "product": {

            "id": new_product.id,

            "name": new_product.name,

            "category": new_product.category,

            "description": new_product.description,

            "price": float(new_product.price),

            "image": new_product.image,

            "stock": new_product.stock,

        },

    }

# =========================================================

# ADMIN - UPDATE PRODUCT

# =========================================================

@app.patch("/admin/products/{product_id}")

def update_admin_product(

    product_id: int,

    product_data: ProductUpdateRequest,

    db: Session = Depends(get_db)

):

    product = (

        db.query(Product)

        .filter(Product.id == product_id)

        .first()

    )

    if not product:

        raise HTTPException(

            status_code=404,

            detail="Product not found."

        )

    product.name = product_data.name.strip()

    product.category = product_data.category.strip()

    product.description = product_data.description.strip()

    product.price = product_data.price

    product.image = product_data.image.strip()

    product.stock = product_data.stock

    try:

        db.commit()

        db.refresh(product)

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to update product."

        )

    return {

        "success": True,

        "message": "Product updated successfully.",

        "product": {

            "id": product.id,

            "name": product.name,

            "category": product.category,

            "description": product.description,

            "price": float(product.price),

            "image": product.image,

            "stock": product.stock,

        },

    }

# =========================================================

# ADMIN - DELETE PRODUCT

# =========================================================

@app.delete("/admin/products/{product_id}")

def delete_admin_product(

    product_id: int,

    db: Session = Depends(get_db)

):

    product = (

        db.query(Product)

        .filter(Product.id == product_id)

        .first()

    )

    if not product:

        raise HTTPException(

            status_code=404,

            detail="Product not found."

        )

    order_item = (

        db.query(OrderItem)

        .filter(OrderItem.product_id == product_id)

        .first()

    )

    if order_item:

        raise HTTPException(

            status_code=400,

            detail="This product is already used in an order and cannot be deleted."

        )

    try:

        db.delete(product)

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to delete product."

        )

    return {

        "success": True,

        "message": "Product deleted successfully.",

        "product_id": product_id,

    }

# =========================================================

# ADMIN - TOGGLE PRODUCT ACTIVE / INACTIVE

# =========================================================

@app.patch("/admin/products/{product_id}/toggle")

def toggle_admin_product(

    product_id: int,

    db: Session = Depends(get_db)

):

    product = (

        db.query(Product)

        .filter(Product.id == product_id)

        .first()

    )

    if not product:

        raise HTTPException(

            status_code=404,

            detail="Product not found."

        )

    # Active -> Inactive

    # Inactive -> Active

    product.active = not product.active

    try:

        db.commit()

        db.refresh(product)

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to update product status."

        )

    return {

        "success": True,

        "message": (

            "Product activated successfully."

            if product.active

            else "Product deactivated successfully."

        ),

        "product": {

            "id": product.id,

            "name": product.name,

            "category": product.category,

            "description": product.description,

            "price": float(product.price),

            "image": product.image,

            "stock": product.stock,

            "active": product.active,

        },

    }

# =========================================================

# CUSTOMER AUTHENTICATION — REGISTER / LOGIN

# =========================================================

AUTH_SECRET = os.getenv(

    "BEERVANA_AUTH_SECRET",

    "local-development-secret-change-before-deployment"

)

PASSWORD_ITERATIONS = 310_000

TOKEN_LIFETIME_SECONDS = 12 * 60 * 60

class CustomerRegisterRequest(BaseModel):

    name: str

    email: str

    password: str

    phone: str = ""

class CustomerLoginRequest(BaseModel):

    email: str

    password: str

def hash_customer_password(password: str) -> str:

    salt = secrets.token_bytes(16)

    password_hash = hashlib.pbkdf2_hmac(

        "sha256",

        password.encode("utf-8"),

        salt,

        PASSWORD_ITERATIONS

    )

    return (

        f"pbkdf2_sha256${PASSWORD_ITERATIONS}"

        f"${salt.hex()}${password_hash.hex()}"

    )

def verify_customer_password(password: str, stored_hash: str) -> bool:

    try:

        algorithm, iterations, salt_hex, expected_hash = stored_hash.split("$", 3)

        if algorithm != "pbkdf2_sha256":

            return False

        calculated_hash = hashlib.pbkdf2_hmac(

            "sha256",

            password.encode("utf-8"),

            bytes.fromhex(salt_hex),

            int(iterations)

        ).hex()

        return hmac.compare_digest(calculated_hash, expected_hash)

    except (ValueError, TypeError):

        return False

def base64url_encode(data: bytes) -> str:

    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def create_customer_token(customer: Customer) -> str:

    header = {"alg": "HS256", "typ": "JWT"}

    payload = {

        "sub": str(customer.id),

        "email": customer.email,

        "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS

    }

    encoded_header = base64url_encode(

        json.dumps(header, separators=(",", ":")).encode("utf-8")

    )

    encoded_payload = base64url_encode(

        json.dumps(payload, separators=(",", ":")).encode("utf-8")

    )

    signing_input = f"{encoded_header}.{encoded_payload}"

    signature = hmac.new(

        AUTH_SECRET.encode("utf-8"),

        signing_input.encode("utf-8"),

        hashlib.sha256

    ).digest()

    return f"{signing_input}.{base64url_encode(signature)}"

def decode_customer_token(token: str):

    try:

        encoded_header, encoded_payload, encoded_signature = token.split(".")

        signing_input = f"{encoded_header}.{encoded_payload}"

        expected_signature = hmac.new(

            AUTH_SECRET.encode("utf-8"),

            signing_input.encode("utf-8"),

            hashlib.sha256,

        ).digest()

        actual_signature = base64.urlsafe_b64decode(

            encoded_signature + "=" * (-len(encoded_signature) % 4)

        )

        if not hmac.compare_digest(expected_signature, actual_signature):

            raise ValueError("Invalid signature")

        payload = json.loads(

            base64.urlsafe_b64decode(

                encoded_payload + "=" * (-len(encoded_payload) % 4)

            )

        )

        if int(payload.get("exp", 0)) <= int(time.time()):

            raise ValueError("Token expired")

        return int(payload["sub"])

    except Exception:

        raise HTTPException(

            status_code=401,

            detail="Invalid or expired login token. Please log in again.",

        )

def customer_public_data(customer: Customer) -> dict:

    return {

        "id": customer.id,

        "name": customer.name,

        "email": customer.email,

        "phone": customer.phone,

        "address": customer.address,

        "city": customer.city,

        "pincode": customer.pincode,

    }

@app.post("/auth/register")

def register_customer(

    customer_data: CustomerRegisterRequest,

    db: Session = Depends(get_db)

):

    name = customer_data.name.strip()

    email = customer_data.email.strip().lower()

    password = customer_data.password

    phone = customer_data.phone.strip()

    if not name:

        raise HTTPException(status_code=400, detail="Name is required.")

    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:

        raise HTTPException(status_code=400, detail="Enter a valid email.")

    if len(password) < 8:

        raise HTTPException(

            status_code=400,

            detail="Password must be at least 8 characters."

        )

    if phone and (not phone.isdigit() or len(phone) != 10):

        raise HTTPException(

            status_code=400,

            detail="Phone number must contain 10 digits."

        )

    existing_customer = (

        db.query(Customer)

        .filter(Customer.email == email)

        .first()

    )

    if existing_customer:

        raise HTTPException(

            status_code=409,

            detail="Email already registered. Please log in."

        )

    customer = Customer(

        name=name,

        email=email,

        password_hash=hash_customer_password(password),

        phone=phone or None

    )

    try:

        db.add(customer)

        db.commit()

        db.refresh(customer)

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Registration failed. Please try again."

        )

    return {

        "success": True,

        "message": "Registration successful.",

        "access_token": create_customer_token(customer),

        "token_type": "bearer",

        "customer": customer_public_data(customer)

    }

@app.post("/auth/login")

def login_customer(

    login_data: CustomerLoginRequest,

    db: Session = Depends(get_db)

):

    email = login_data.email.strip().lower()

    customer = (

        db.query(Customer)

        .filter(Customer.email == email)

        .first()

    )

    if not customer or not verify_customer_password(

        login_data.password,

        customer.password_hash

    ):

        raise HTTPException(

            status_code=401,

            detail="Invalid email or password."

        )

    return {

        "success": True,

        "message": "Login successful.",

        "access_token": create_customer_token(customer),

        "token_type": "bearer",

        "customer": customer_public_data(customer)

    }


# =========================================================
# CUSTOMER AUTHENTICATION DEPENDENCY
# =========================================================

def get_current_customer(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Please log in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    customer_id = decode_customer_token(token)

    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=401,
            detail="Customer account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return customer


# =========================================================
# CUSTOMER ADDRESS SCHEMA
# =========================================================

class AddressCreate(BaseModel):
    label: str = Field(default="Home", min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=10, max_length=10)
    address_line: str = Field(min_length=1, max_length=500)
    landmark: Optional[str] = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    pincode: str = Field(min_length=6, max_length=6)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False


# =========================================================
# CUSTOMER ADDRESS HELPERS
# =========================================================

def address_to_dict(address: CustomerAddress) -> dict:
    return {
        "id": address.id,
        "label": address.label,
        "full_name": address.full_name,
        "phone": address.phone,
        "address_line": address.address_line,
        "landmark": address.landmark,
        "city": address.city,
        "state": address.state,
        "pincode": address.pincode,
        "latitude": address.latitude,
        "longitude": address.longitude,
        "is_default": address.is_default,
    }


# =========================================================
# GET LOGGED-IN CUSTOMER ADDRESSES
# =========================================================

@app.get("/customer/addresses")
def get_customer_addresses(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    addresses = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.customer_id == customer.id)
        .order_by(CustomerAddress.is_default.desc(), CustomerAddress.id.desc())
        .all()
    )

    return {
        "success": True,
        "addresses": [address_to_dict(address) for address in addresses],
    }


# =========================================================
# SAVE ADDRESS FOR LOGGED-IN CUSTOMER
# =========================================================

@app.post("/customer/addresses")
def save_customer_address(
    payload: AddressCreate,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    label = payload.label.strip()
    full_name = payload.full_name.strip()
    address_line = payload.address_line.strip()
    city = payload.city.strip()
    state = payload.state.strip()
    landmark = payload.landmark.strip() if payload.landmark else None

    if not label or not full_name or not address_line or not city or not state:
        raise HTTPException(
            status_code=400,
            detail="Please fill in all required address fields.",
        )

    if not payload.phone.isdigit() or len(payload.phone) != 10:
        raise HTTPException(status_code=400, detail="Phone number must contain 10 digits.")

    if not payload.pincode.isdigit() or len(payload.pincode) != 6:
        raise HTTPException(status_code=400, detail="Pincode must contain 6 digits.")

    if payload.latitude is not None and not -90 <= payload.latitude <= 90:
        raise HTTPException(status_code=400, detail="Invalid latitude.")

    if payload.longitude is not None and not -180 <= payload.longitude <= 180:
        raise HTTPException(status_code=400, detail="Invalid longitude.")

    try:
        if payload.is_default:
            db.query(CustomerAddress).filter(
                CustomerAddress.customer_id == customer.id
            ).update({"is_default": False}, synchronize_session=False)

        address = CustomerAddress(
            customer_id=customer.id,
            label=label,
            full_name=full_name,
            phone=payload.phone,
            address_line=address_line,
            landmark=landmark,
            city=city,
            state=state,
            pincode=payload.pincode,
            latitude=payload.latitude,
            longitude=payload.longitude,
            is_default=payload.is_default,
        )

        db.add(address)
        db.commit()
        db.refresh(address)

        return {
            "success": True,
            "message": "Address saved successfully.",
            "address": address_to_dict(address),
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save address. Please try again.",
        )
