"""
User Schemas - Request/Response models for user endpoints
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserResponse(BaseModel):
    """User profile response"""
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    status: str
    email_verified: bool
    phone_verified: bool
    two_fa_enabled: bool
    created_at: Optional[str] = None
    
    # Role-specific fields
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    institution: Optional[str] = None
    research_area: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """User profile update request"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    
    # Patient fields
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    
    # Doctor fields
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    
    # Researcher fields
    institution: Optional[str] = None
    research_area: Optional[str] = None


class Toggle2FARequest(BaseModel):
    """Toggle 2FA request"""
    enabled: bool


class Toggle2FAResponse(BaseModel):
    """Toggle 2FA response"""
    success: bool
    enabled: bool
    message: str = "2FA setting updated"


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
