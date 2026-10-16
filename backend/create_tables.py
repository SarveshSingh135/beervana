from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

print("Products table created successfully!")