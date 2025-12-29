"""
Database Configuration and Session Management
Uses SQLAlchemy ORM for PostgreSQL database operations
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:2025@localhost:5432/postgres")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before use
    pool_size=10,  # Maximum pool size
    max_overflow=20,  # Additional connections beyond pool_size
    echo=False  # Set to True for SQL query logging (debugging)
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Database session dependency for FastAPI routes.
    Creates a new database session for each request and closes it after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Call this at application startup to create all tables.
    """
    from app.models import user, otp_token, pcg_upload, analysis_result, doctor_patient, dataset
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
