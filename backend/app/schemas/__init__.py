"""
Pydantic Schemas Package
Request/Response validation models
"""
from app.schemas.auth import (
    SignupRequest,
    SignupResponse,
    LoginRequest,
    LoginResponse,
    OTPRequest,
    OTPVerifyRequest,
    OTPVerifyResponse,
    TokenResponse,
    ForgotPasswordRequest,
)
from app.schemas.user import (
    UserResponse,
    UserUpdateRequest,
    Toggle2FARequest,
)
from app.schemas.pcg import (
    PCGUploadResponse,
    PCGStatusResponse,
    PCGResultsResponse,
    PCGListResponse,
)
from app.schemas.admin import (
    AdminUserListResponse,
    AdminUserActionRequest,
    AdminStatsResponse,
)

__all__ = [
    # Auth
    "SignupRequest",
    "SignupResponse",
    "LoginRequest",
    "LoginResponse",
    "OTPRequest",
    "OTPVerifyRequest",
    "OTPVerifyResponse",
    "TokenResponse",
    "ForgotPasswordRequest",
    # User
    "UserResponse",
    "UserUpdateRequest",
    "Toggle2FARequest",
    # PCG
    "PCGUploadResponse",
    "PCGStatusResponse",
    "PCGResultsResponse",
    "PCGListResponse",
    # Admin
    "AdminUserListResponse",
    "AdminUserActionRequest",
    "AdminStatsResponse",
]
