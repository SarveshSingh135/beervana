from database import SessionLocal
from models import Product

db = SessionLocal()

try:
    if db.query(Product).count() == 0:
        products = [
            Product(
                name="Golden Lager",
                category="Lager",
                description="Demo product",
                price=199.0,
                image="",
                stock=20
            ),
            Product(
                name="Wheat Bliss",
                category="Wheat Beer",
                description="Demo product",
                price=249.0,
                image="",
                stock=15
            ),
            Product(
                name="Classic Brew",
                category="Classic",
                description="Demo product",
                price=179.0,
                image="",
                stock=10
            ),
        ]

        db.add_all(products)
        db.commit()
        print("Demo products added successfully!")
    else:
        print("Products already exist!")

finally:
    db.close()