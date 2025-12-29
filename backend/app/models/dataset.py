"""
Dataset Model - For researcher access to anonymized data
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from datetime import datetime
import enum

from app.database import Base


class DatasetStatus(str, enum.Enum):
    """Status of dataset availability"""
    AVAILABLE = "available"  # Open for access requests
    RESTRICTED = "restricted"  # Admin approval needed
    ARCHIVED = "archived"  # No longer available


class AccessRequestStatus(str, enum.Enum):
    """Status of researcher access request"""
    PENDING = "pending"  # Waiting for admin approval
    APPROVED = "approved"  # Access granted
    REJECTED = "rejected"  # Access denied
    EXPIRED = "expired"  # Access period ended


class Dataset(Base):
    """
    Dataset table - stores available research datasets
    """
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Dataset metadata
    status = Column(Enum(DatasetStatus), default=DatasetStatus.AVAILABLE, nullable=False)
    total_samples = Column(Integer, default=0)
    file_path = Column(String(500), nullable=True)
    
    # Access control
    requires_approval = Column(Integer, default=1)  # 1=yes, 0=no
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Dataset(id={self.id}, name={self.name})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "total_samples": self.total_samples,
        }


class DatasetAccess(Base):
    """
    Dataset Access table - tracks researcher access requests
    """
    __tablename__ = "dataset_access"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    researcher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Request details
    status = Column(Enum(AccessRequestStatus), default=AccessRequestStatus.PENDING, nullable=False)
    purpose = Column(Text, nullable=True)
    
    # Admin handling
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<DatasetAccess(dataset_id={self.dataset_id}, researcher_id={self.researcher_id})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "researcher_id": self.researcher_id,
            "status": self.status.value if self.status else None,
            "requested_at": self.requested_at.isoformat() if self.requested_at else None,
        }
