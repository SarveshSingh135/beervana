
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean
)
from sqlalchemy.sql import func
from database import Base


# ==========================================
# PRODUCT
# ==========================================

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(String(500))
    price = Column(Float, nullable=False)
    image = Column(String(255))
    stock = Column(Integer, default=0)
    active = Column(Boolean, nullable=False, default=True)


# ==========================================
# CUSTOMER / ACCOUNT
# ==========================================

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    # Store only a secure password hash, never the plain password.
    password_hash = Column(String(255), nullable=False)

    phone = Column(String(20), nullable=True)

    # Saved delivery address
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )


# ==========================================
# ORDER
# ==========================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    customer_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)

    payment_method = Column(String(30), nullable=False)

    delivery_option = Column(
        String(30),
        nullable=False,
        default="standard"
    )

    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False, default=0)
    total_amount = Column(Float, nullable=False)

    status = Column(
        String(30),
        nullable=False,
        default="Pending"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


# ==========================================
# ORDER ITEM
# ==========================================

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product_name = Column(String(150), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    # ==========================================
# CUSTOMER SAVED DELIVERY ADDRESSES
# ==========================================

class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False,
        index=True
    )

    label = Column(String(50), nullable=False, default="Home")
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)

    address_line = Column(String(500), nullable=False)
    landmark = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    is_default = Column(Boolean, nullable=False, default=False)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )
