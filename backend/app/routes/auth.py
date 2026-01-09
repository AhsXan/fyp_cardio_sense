"""
Authentication Routes
Handles signup, login, OTP verification, password reset
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import json
import secrets
import io

from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.otp_token import OTPType, OTPToken
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

# Temporary storage for pending signups (before OTP verification)
# In production, use Redis or a database table
pending_signups = {}


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
    Register a new user (Step 1: Store data temporarily, don't create user yet)
    User will be created only AFTER OTP verification
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
            detail="User with this email already exists. Please login or use a different email."
        )
    
    # Generate unique signup token
    signup_token = secrets.token_urlsafe(32)
    
    # Store signup data temporarily (will create user after OTP verification)
    signup_data = {
        "email": email.lower(),
        "password_hash": hash_password(password),
        "full_name": full_name,
        "phone": phone,
        "role": role,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "blood_group": blood_group,
        "license_number": license_number,
        "specialization": specialization,
        "hospital": hospital,
        "institution": institution,
        "research_area": research_area,
        "license_document": None,  # Will handle file after user creation
        "affiliation_document": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Handle document uploads temporarily
    if license_document:
        content = await license_document.read()
        signup_data["license_document"] = {
            "filename": license_document.filename,
            "content_type": license_document.content_type,
            "content": content
        }
    
    if affiliation_document:
        content = await affiliation_document.read()
        signup_data["affiliation_document"] = {
            "filename": affiliation_document.filename,
            "content_type": affiliation_document.content_type,
            "content": content
        }
    
    # Store in temporary storage
    pending_signups[signup_token] = signup_data
    
    # Create a temporary OTP token record to send OTP (without user_id)
    otp_code = OTPService.generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    temp_otp = OTPToken(
        user_id=None,  # Will be set after user creation
        otp_code=otp_code,
        token_type=OTPType.SIGNUP_VERIFY,
        temp_token=signup_token,
        expires_at=expires_at
    )
    
    db.add(temp_otp)
    db.commit()
    
    # Send OTP (email for Gmail, terminal for others)
    from app.services.email_service import EmailService
    email_sent = False
    if EmailService.is_gmail(email):
        email_sent = EmailService.send_otp_email(email, otp_code, "Email Verification")
    
    if not email_sent:
        # Print to terminal
        print("\n" + "=" * 60)
        print("📧 SIGNUP OTP - TERMINAL OUTPUT")
        print("=" * 60)
        print(f"📍 Purpose: Email Verification (Signup)")
        print(f"👤 User: {email}")
        print(f"🔑 OTP Code: {otp_code}")
        print(f"⏰ Expires: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"⏳ Valid for: 15 minutes")
        print("=" * 60)
        print("💡 Use this code in the frontend to verify")
        print("=" * 60 + "\n")
    
    print(f"\n📝 Pending Signup: {email} (Role: {role}) - Awaiting OTP verification")
    
    return SignupResponse(
        user_id=None,  # Will be assigned after OTP verification
        pending_verification=True,
        message="Signup initiated. Please verify your email with the OTP sent to you.",
        signup_token=signup_token  # Need to add this field to response model
    )


@router.post("/verify-signup-otp", response_model=OTPVerifyResponse)
async def verify_signup_otp(
    request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP to complete signup and create user in database
    (Step 2: Create user AFTER OTP verification)
    """
    # Find OTP by code and temp_token (signup_token)
    otp_token = db.query(OTPToken).filter(
        OTPToken.otp_code == request.otp,
        OTPToken.temp_token == request.signup_token,
        OTPToken.token_type == OTPType.SIGNUP_VERIFY,
        OTPToken.used.is_(None)
    ).first()
    
    if not otp_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    if not otp_token.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )
    
    # Get pending signup data
    signup_token = request.signup_token
    if signup_token not in pending_signups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup session expired. Please sign up again."
        )
    
    signup_data = pending_signups[signup_token]
    
    # NOW create the user (after OTP verification)
    user_role = UserRole(signup_data["role"])
    
    user = User(
        email=signup_data["email"],
        password_hash=signup_data["password_hash"],
        full_name=signup_data["full_name"],
        phone=signup_data["phone"],
        role=user_role,
        status=UserStatus.PENDING,
        email_verified=True  # Mark as verified since OTP is confirmed
    )
    
    # Add role-specific fields
    if user_role == UserRole.PATIENT:
        if signup_data.get("date_of_birth"):
            try:
                user.date_of_birth = datetime.fromisoformat(signup_data["date_of_birth"])
            except:
                pass
        user.gender = signup_data.get("gender")
        user.blood_group = signup_data.get("blood_group")
        # Activate patients immediately after OTP verification
        user.status = UserStatus.ACTIVE
    
    elif user_role == UserRole.DOCTOR:
        user.license_number = signup_data.get("license_number")
        user.specialization = signup_data.get("specialization")
        user.hospital = signup_data.get("hospital")
    
    elif user_role == UserRole.RESEARCHER:
        user.institution = signup_data.get("institution")
        user.research_area = signup_data.get("research_area")
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Handle document uploads for doctor/researcher
    if user_role == UserRole.DOCTOR and signup_data.get("license_document"):
        doc_data = signup_data["license_document"]
        # Create UploadFile-like object from stored data
        file_obj = io.BytesIO(doc_data["content"])
        file_obj.name = doc_data["filename"]
        from fastapi import UploadFile as UP
        upload_file = UP(filename=doc_data["filename"], file=file_obj)
        _, file_path = await FileService.save_document(upload_file, user.id, "license")
        user.license_document_path = file_path
        db.commit()
    
    if user_role == UserRole.RESEARCHER and signup_data.get("affiliation_document"):
        doc_data = signup_data["affiliation_document"]
        file_obj = io.BytesIO(doc_data["content"])
        file_obj.name = doc_data["filename"]
        from fastapi import UploadFile as UP
        upload_file = UP(filename=doc_data["filename"], file=file_obj)
        _, file_path = await FileService.save_document(upload_file, user.id, "affiliation")
        user.affiliation_document_path = file_path
        db.commit()
    
    # Mark OTP as used
    otp_token.mark_as_used()
    db.commit()
    
    # Clean up pending signup data
    del pending_signups[signup_token]
    
    print(f"\n✅ User Created: {user.email} (Role: {user.role.value}) - OTP Verified")
    
    return OTPVerifyResponse(
        verified=True,
        message="Email verified successfully. Account created!",
        user_id=user.id
    )


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
        # Check if email is verified
        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email first. Check your email for OTP."
            )
        # Email verified but account pending admin approval (doctor/researcher)
        if user.role in [UserRole.DOCTOR, UserRole.RESEARCHER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your {user.role.value} account is pending admin approval. Please try again later."
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending verification."
        )
    
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended"
        )
    
    if user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your {user.role.value} registration has been rejected by admin. Please contact support for more information."
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
