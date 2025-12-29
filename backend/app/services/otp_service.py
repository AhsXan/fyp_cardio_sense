"""
OTP Service - Handles OTP generation, storage, and verification
Outputs OTP to terminal for debugging (as per user preference)
"""
import random
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from app.models.otp_token import OTPToken, OTPType
from app.models.user import User

load_dotenv()

OTP_LENGTH = int(os.getenv("OTP_LENGTH", "6"))
OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "15"))


class OTPService:
    """
    Service for OTP operations
    - Generate OTP
    - Store in database
    - Verify OTP
    - Print to terminal (for debugging)
    """
    
    @staticmethod
    def generate_otp(length: int = OTP_LENGTH) -> str:
        """
        Generate a random numeric OTP
        """
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def create_otp(
        db: Session,
        user_id: int,
        otp_type: OTPType,
        temp_token: Optional[str] = None
    ) -> Tuple[str, OTPToken]:
        """
        Create and store a new OTP for a user
        Returns: (otp_code, otp_token_object)
        """
        # Invalidate any existing OTPs of the same type for this user
        db.query(OTPToken).filter(
            OTPToken.user_id == user_id,
            OTPToken.token_type == otp_type,
            OTPToken.used.is_(None)
        ).update({"used": datetime.utcnow()})
        
        # Generate new OTP
        otp_code = OTPService.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
        
        # Create OTP token record
        otp_token = OTPToken(
            user_id=user_id,
            otp_code=otp_code,
            token_type=otp_type,
            temp_token=temp_token,
            expires_at=expires_at
        )
        
        db.add(otp_token)
        db.commit()
        db.refresh(otp_token)
        
        # Get user email for display
        user = db.query(User).filter(User.id == user_id).first()
        user_email = user.email if user else "Unknown"
        
        # Print OTP to terminal (as per user preference)
        OTPService._print_otp_to_terminal(otp_code, user_email, otp_type, expires_at)
        
        return otp_code, otp_token
    
    @staticmethod
    def verify_otp(
        db: Session,
        otp_code: str,
        user_id: Optional[int] = None,
        temp_token: Optional[str] = None,
        otp_type: Optional[OTPType] = None
    ) -> Tuple[bool, Optional[OTPToken], str]:
        """
        Verify an OTP code
        Returns: (is_valid, otp_token, message)
        """
        query = db.query(OTPToken).filter(
            OTPToken.otp_code == otp_code,
            OTPToken.used.is_(None)
        )
        
        if user_id:
            query = query.filter(OTPToken.user_id == user_id)
        
        if temp_token:
            query = query.filter(OTPToken.temp_token == temp_token)
        
        if otp_type:
            query = query.filter(OTPToken.token_type == otp_type)
        
        otp_token = query.first()
        
        if not otp_token:
            print(f"\n❌ OTP Verification Failed: Invalid OTP code '{otp_code}'")
            return False, None, "Invalid OTP code"
        
        if not otp_token.is_valid():
            print(f"\n❌ OTP Verification Failed: OTP expired")
            return False, otp_token, "OTP has expired"
        
        # Mark OTP as used
        otp_token.mark_as_used()
        db.commit()
        
        print(f"\n✅ OTP Verified Successfully for User ID: {otp_token.user_id}")
        
        return True, otp_token, "OTP verified successfully"
    
    @staticmethod
    def get_user_by_temp_token(db: Session, temp_token: str) -> Optional[User]:
        """
        Get user from a temporary token (for 2FA flow)
        """
        otp_token = db.query(OTPToken).filter(
            OTPToken.temp_token == temp_token,
            OTPToken.used.is_(None)
        ).first()
        
        if otp_token and otp_token.is_valid():
            return db.query(User).filter(User.id == otp_token.user_id).first()
        
        return None
    
    @staticmethod
    def _print_otp_to_terminal(
        otp_code: str,
        user_email: str,
        otp_type: OTPType,
        expires_at: datetime
    ):
        """
        Print OTP to terminal for debugging
        (User preference: terminal-based feedback instead of email)
        """
        type_labels = {
            OTPType.SIGNUP_VERIFY: "Email Verification",
            OTPType.LOGIN_2FA: "Two-Factor Authentication",
            OTPType.PASSWORD_RESET: "Password Reset",
            OTPType.PHONE_VERIFY: "Phone Verification",
        }
        
        print("\n" + "=" * 60)
        print("📧 OTP GENERATED - TERMINAL OUTPUT")
        print("=" * 60)
        print(f"📍 Purpose: {type_labels.get(otp_type, 'Unknown')}")
        print(f"👤 User: {user_email}")
        print(f"🔑 OTP Code: {otp_code}")
        print(f"⏰ Expires: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"⏳ Valid for: {OTP_EXPIRE_MINUTES} minutes")
        print("=" * 60)
        print("💡 Use this code in the frontend to verify")
        print("=" * 60 + "\n")
    
    @staticmethod
    def cleanup_expired_otps(db: Session) -> int:
        """
        Clean up expired OTPs from database
        Returns: Number of deleted records
        """
        result = db.query(OTPToken).filter(
            OTPToken.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        return result
