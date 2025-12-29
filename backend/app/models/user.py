"""
User Model - Handles patients, doctors, researchers, and admins
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system"""
    PATIENT = "patient"
    DOCTOR = "doctor"
    RESEARCHER = "researcher"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    """User account status"""
    PENDING = "pending"  # Awaiting email verification
    ACTIVE = "active"  # Verified and active
    SUSPENDED = "suspended"  # Admin suspended
    REJECTED = "rejected"  # Admin rejected (for doctor/researcher)


class User(Base):
    """
    User table - stores all user types
    """
    __tablename__ = "users"

    # Primary fields
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Role and status
    role = Column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.PENDING)
    
    # Verification flags
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    two_fa_enabled = Column(Boolean, default=False)
    
    # Role-specific fields (nullable for flexibility)
    # Patient fields
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    medical_history = Column(Text, nullable=True)
    
    # Doctor fields
    license_number = Column(String(100), nullable=True)
    specialization = Column(String(255), nullable=True)
    hospital = Column(String(255), nullable=True)
    license_document_path = Column(String(500), nullable=True)
    
    # Researcher fields
    institution = Column(String(255), nullable=True)
    research_area = Column(String(255), nullable=True)
    affiliation_document_path = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    otp_tokens = relationship("OTPToken", back_populates="user", cascade="all, delete-orphan")
    pcg_uploads = relationship(
        "PCGUpload", 
        back_populates="user", 
        cascade="all, delete-orphan",
        primaryjoin="User.id == foreign(PCGUpload.user_id)"
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    def to_dict(self):
        """Convert user to dictionary for API responses"""
        base_dict = {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role.value if self.role else None,
            "status": self.status.value if self.status else None,
            "email_verified": self.email_verified,
            "phone_verified": self.phone_verified,
            "two_fa_enabled": self.two_fa_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        # Add role-specific fields
        if self.role == UserRole.PATIENT:
            base_dict.update({
                "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
                "gender": self.gender,
                "blood_group": self.blood_group,
            })
        elif self.role == UserRole.DOCTOR:
            base_dict.update({
                "license_number": self.license_number,
                "specialization": self.specialization,
                "hospital": self.hospital,
            })
        elif self.role == UserRole.RESEARCHER:
            base_dict.update({
                "institution": self.institution,
                "research_area": self.research_area,
            })
            
        return base_dict
