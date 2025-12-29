"""
Authentication Routes
Handles signup, login, OTP verification, password reset
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.otp_token import OTPType
from app.schemas.auth import (
    SignupRequest, SignupResponse,
    LoginRequest, LoginResponse,
    OTPRequest, OTPVerifyRequest, OTPVerifyResponse,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, create_temp_token,
    verify_token
)
from app.services.otp_service import OTPService
from app.services.file_service import FileService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup/{role}", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    role: str,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    password: str = Form(...),
    confirm_password: str = Form(...),
    # Patient fields
    date_of_birth: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    blood_group: Optional[str] = Form(None),
    # Doctor fields
    license_number: Optional[str] = Form(None),
    specialization: Optional[str] = Form(None),
    hospital: Optional[str] = Form(None),
    license_document: Optional[UploadFile] = File(None),
    # Researcher fields
    institution: Optional[str] = Form(None),
    research_area: Optional[str] = Form(None),
    affiliation_document: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Register a new user
    Roles: patient, doctor, researcher
    """
    # Validate role
    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed: patient, doctor, researcher"
        )
    
    # Check password match
    if password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name,
        phone=phone,
        role=user_role,
        status=UserStatus.PENDING
    )
    
    # Add role-specific fields
    if user_role == UserRole.PATIENT:
        if date_of_birth:
            try:
                user.date_of_birth = datetime.fromisoformat(date_of_birth)
            except:
                pass
        user.gender = gender
        user.blood_group = blood_group
    
    elif user_role == UserRole.DOCTOR:
        user.license_number = license_number
        user.specialization = specialization
        user.hospital = hospital
        
    elif user_role == UserRole.RESEARCHER:
        user.institution = institution
        user.research_area = research_area
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Handle document uploads for doctor/researcher
    if user_role == UserRole.DOCTOR and license_document:
        _, file_path = await FileService.save_document(license_document, user.id, "license")
        user.license_document_path = file_path
        db.commit()
    
    if user_role == UserRole.RESEARCHER and affiliation_document:
        _, file_path = await FileService.save_document(affiliation_document, user.id, "affiliation")
        user.affiliation_document_path = file_path
        db.commit()
    
    print(f"\n📝 New User Signup: {email} (Role: {role})")
    
    return SignupResponse(
        user_id=user.id,
        pending_verification=True,
        message="User created. Please verify your email."
    )


@router.post("/send-signup-otp")
async def send_signup_otp(
    request: OTPRequest,
    db: Session = Depends(get_db)
):
    """
    Send OTP to verify email after signup
    """
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate and send OTP
    OTPService.create_otp(db, user.id, OTPType.SIGNUP_VERIFY)
    
    return {"success": True, "message": "OTP sent to your email (check terminal)"}


@router.post("/verify-signup-otp", response_model=OTPVerifyResponse)
async def verify_signup_otp(
    request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP to complete email verification
    """
    is_valid, otp_token, message = OTPService.verify_otp(
        db,
        otp_code=request.otp,
        user_id=request.user_id,
        otp_type=OTPType.SIGNUP_VERIFY
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Mark user as verified
    user = db.query(User).filter(User.id == otp_token.user_id).first()
    if user:
        user.email_verified = True
        # Activate patients immediately, doctors/researchers need admin approval
        if user.role == UserRole.PATIENT:
            user.status = UserStatus.ACTIVE
        db.commit()
    
    return OTPVerifyResponse(verified=True, message="Email verified successfully")


@router.post("/login")
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login user
    Returns tokens if no 2FA, otherwise returns temp_token for OTP
    """
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.status == UserStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first"
        )
    
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    if user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration was rejected"
        )
    
    # Check if 2FA is enabled
    if user.two_fa_enabled:
        # Generate temp token and send OTP
        temp_token = create_temp_token(user.id)
        OTPService.create_otp(db, user.id, OTPType.LOGIN_2FA, temp_token)
        
        return {
            "requires_otp": True,
            "temp_token": temp_token,
            "message": "OTP sent to your email (check terminal)"
        }
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    print(f"\n🔐 User Login: {user.email} (Role: {user.role.value})")
    
    return {
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/send-login-otp")
async def send_login_otp(
    request: OTPRequest,
    db: Session = Depends(get_db)
):
    """
    Resend OTP for 2FA login
    """
    if not request.temp_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temporary token required"
        )
    
    user = OTPService.get_user_by_temp_token(db, request.temp_token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Generate new OTP with same temp token
    OTPService.create_otp(db, user.id, OTPType.LOGIN_2FA, request.temp_token)
    
    return {"success": True, "message": "OTP sent (check terminal)"}


@router.post("/verify-login-otp")
async def verify_login_otp(
    request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP for 2FA login
    """
    is_valid, otp_token, message = OTPService.verify_otp(
        db,
        otp_code=request.otp,
        temp_token=request.temp_token,
        otp_type=OTPType.LOGIN_2FA
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    user = db.query(User).filter(User.id == otp_token.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    print(f"\n🔐 User Login (2FA): {user.email}")
    
    return {
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset
    """
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    # Don't reveal if user exists
    if user:
        OTPService.create_otp(db, user.id, OTPType.PASSWORD_RESET)
    
    return {"success": True, "message": "If email exists, reset OTP has been sent (check terminal)"}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using OTP
    """
    # Verify the reset token/OTP
    is_valid, otp_token, message = OTPService.verify_otp(
        db,
        otp_code=request.token,
        otp_type=OTPType.PASSWORD_RESET
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Check password match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Update password
    user = db.query(User).filter(User.id == otp_token.user_id).first()
    if user:
        user.password_hash = hash_password(request.new_password)
        db.commit()
        print(f"\n🔑 Password Reset: {user.email}")
    
    return {"success": True, "message": "Password reset successfully"}


@router.post("/refresh-token")
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    payload = verify_token(refresh_token, "refresh")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate new tokens
    new_access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }
