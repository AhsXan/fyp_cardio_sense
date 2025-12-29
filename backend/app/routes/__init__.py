"""
Routes Package
API endpoint handlers
"""
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.pcg import router as pcg_router
from app.routes.admin import router as admin_router
from app.routes.doctor import router as doctor_router
from app.routes.researcher import router as researcher_router

__all__ = [
    "auth_router",
    "user_router",
    "pcg_router",
    "admin_router",
    "doctor_router",
    "researcher_router",
]
