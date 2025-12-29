"""
Cardio Sense Backend - Main Application
FastAPI application with all routes and middleware
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Import database and models
from app.database import engine, Base, get_db
from app.models.user import User, UserRole, UserStatus
from app.utils.security import hash_password

# Import routes
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.pcg import router as pcg_router
from app.routes.admin import router as admin_router
from app.routes.doctor import router as doctor_router
from app.routes.researcher import router as researcher_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    print("\n" + "=" * 60)
    print("🚀 CARDIO SENSE BACKEND - STARTING UP")
    print("=" * 60)
    
    # Create database tables
    print("\n📊 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
    
    # Create admin user if not exists
    from sqlalchemy.orm import Session
    db = next(get_db())
    
    admin_email = os.getenv("ADMIN_EMAIL", "admin@cardiosense.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "AdminPass123!")
    
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True
        )
        db.add(admin_user)
        db.commit()
        print(f"\n👑 Admin user created:")
        print(f"   Email: {admin_email}")
        print(f"   Password: {admin_password}")
    else:
        print(f"\n👑 Admin user exists: {admin_email}")
    
    db.close()
    
    print("\n" + "=" * 60)
    print("✅ SERVER READY")
    print("📍 API Docs: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("=" * 60 + "\n")
    
    yield
    
    # Shutdown
    print("\n" + "=" * 60)
    print("👋 CARDIO SENSE BACKEND - SHUTTING DOWN")
    print("=" * 60 + "\n")


# Create FastAPI app
app = FastAPI(
    title="Cardio Sense Backend API",
    description="AI-powered cardiac sound (S1/S2) analysis backend for Cardio Sense application",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"\n❌ Unhandled Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)}
    )


# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(pcg_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(doctor_router, prefix="/api")
app.include_router(researcher_router, prefix="/api")


# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Cardio Sense Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }


# API info endpoint
@app.get("/api")
def api_info():
    return {
        "name": "Cardio Sense API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "user": "/api/user/*",
            "pcg": "/api/pcg/*",
            "admin": "/api/admin/*",
            "doctor": "/api/doctor/*",
            "researcher": "/api/researcher/*"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True
    )
