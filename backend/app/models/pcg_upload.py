"""
PCG Upload Model - Handles phonocardiogram audio file uploads
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class UploadStatus(str, enum.Enum):
    """Status of PCG upload processing"""
    QUEUED = "queued"  # Waiting to be processed
    PROCESSING = "processing"  # Currently being analyzed
    COMPLETED = "completed"  # Analysis finished
    FAILED = "failed"  # Processing failed
    PENDING_APPROVAL = "pending_approval"  # Waiting for doctor approval


class PCGUpload(Base):
    """
    PCG Upload table - stores audio file metadata and status
    """
    __tablename__ = "pcg_uploads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # File information
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    file_format = Column(String(20), nullable=True)  # wav, mp3, etc.
    
    # Recording metadata
    device = Column(String(255), nullable=True)
    recording_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Processing status
    status = Column(Enum(UploadStatus), default=UploadStatus.QUEUED, nullable=False)
    progress = Column(Integer, default=0)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Doctor assignment (optional)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="pcg_uploads", foreign_keys=[user_id])
    analysis_results = relationship("AnalysisResult", back_populates="pcg_upload", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PCGUpload(id={self.id}, user_id={self.user_id}, status={self.status})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.original_filename,
            "status": self.status.value if self.status else None,
            "progress": self.progress,
            "device": self.device,
            "recording_time": self.recording_time.isoformat() if self.recording_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }
