"""
Migration script to make user_id nullable in otp_tokens table
This is needed for the new signup flow where OTP is created before user
"""
from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Make user_id column nullable
        conn.execute(text("ALTER TABLE otp_tokens ALTER COLUMN user_id DROP NOT NULL;"))
        conn.commit()
        print("✅ Database migration completed: user_id column is now nullable in otp_tokens table")

if __name__ == "__main__":
    migrate()
