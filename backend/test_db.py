from database import test_connection

try:
    db_name = test_connection()
    print("Database connected successfully!")
    print("Database:", db_name)
except Exception as e:
    print("Database connection failed:", e)