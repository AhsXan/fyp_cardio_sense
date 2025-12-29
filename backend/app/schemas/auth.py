"""
Authentication Schemas - Request/Response models for auth endpoints
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re


class SignupRequest(BaseModel):
    """Base signup request - common fields for all roles"""
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    
    # Role-specific fields (optional, depends on role)
    # Patient
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    
    # Doctor
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    
    # Researcher
    institution: Optional[str] = None
    research_area: Optional[str] = None
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format (use E.164 format)')
        return v


class SignupResponse(BaseModel):
    """Signup response"""
    user_id: int
    pending_verification: bool = True
    message: str = "User created. Please verify your email."


class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    """Login response - success without 2FA"""
    user: dict
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class Login2FAResponse(BaseModel):
    """Login response - requires 2FA"""
    requires_otp: bool = True
    temp_token: str
    message: str = "OTP sent to your email"


class OTPRequest(BaseModel):
    """Request to send OTP"""
    email: Optional[EmailStr] = None
    temp_token: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    """OTP verification request"""
    user_id: Optional[int] = None
    temp_token: Optional[str] = None
    otp: str = Field(..., min_length=6, max_length=6)
    
    @validator('otp')
    def validate_otp(cls, v):
        if not v.isdigit():
            raise ValueError('OTP must be numeric')
        return v


class OTPVerifyResponse(BaseModel):
    """OTP verification response"""
    verified: bool
    message: str = "Verification successful"


class TokenResponse(BaseModel):
    """Token refresh response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v
