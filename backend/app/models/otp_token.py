"""
OTP Token Model - Handles one-time passwords for verification and 2FA
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum

from app.database import Base


class OTPType(str, enum.Enum):
    """Types of OTP tokens"""
    SIGNUP_VERIFY = "signup_verify"  # Email verification during signup
    LOGIN_2FA = "login_2fa"  # Two-factor authentication
    PASSWORD_RESET = "password_reset"  # Forgot password
    PHONE_VERIFY = "phone_verify"  # Phone verification


class OTPToken(Base):
    """
    OTP Token table - stores temporary verification codes
    """
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Nullable for signup OTP
    otp_code = Column(String(10), nullable=False)
    token_type = Column(Enum(OTPType), nullable=False)
    temp_token = Column(String(255), nullable=True)  # For 2FA login flow or signup token
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used = Column(DateTime, nullable=True)  # When it was used (null if not used)
    
    # Relationship
    user = relationship("User", back_populates="otp_tokens")
    
    def __repr__(self):
        return f"<OTPToken(id={self.id}, user_id={self.user_id}, type={self.token_type})>"
    
    def is_valid(self):
        """Check if OTP is still valid (not expired and not used)"""
        return self.expires_at > datetime.utcnow() and self.used is None
    
    def mark_as_used(self):
        """Mark OTP as used"""
        self.used = datetime.utcnow()
    
    @staticmethod
    def generate_expiry(minutes: int = 15):
        """Generate expiry time"""
        return datetime.utcnow() + timedelta(minutes=minutes)
