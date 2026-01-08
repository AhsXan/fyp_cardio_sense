"""Analysis Result Model - Stores AI/ML analysis results for PCG uploads"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ClassificationResult(str, enum.Enum):
    """Heart sound classification result"""
    NORMAL = "NORMAL"
    ABNORMAL = "ABNORMAL"
    PENDING = "PENDING"


class AnalysisResult(Base):
    """
    Analysis Result table - stores heart sound classification and S1/S2 detection results
    Populated by the AI model after PCG upload
    """
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("pcg_uploads.id", ondelete="CASCADE"), nullable=False)
    
    # ============== AI CLASSIFICATION RESULTS ==============
    # Primary classification: NORMAL or ABNORMAL
    classification = Column(Enum(ClassificationResult), default=ClassificationResult.PENDING)
    classification_confidence = Column(Float, default=0.0)  # 0-100%
    probability_normal = Column(Float, default=0.0)  # 0-100%
    probability_abnormal = Column(Float, default=0.0)  # 0-100%
    
    # ============== S1/S2 DETECTION RESULTS ==============
    # Analysis results stored as JSON
    # Format: [{"label": "S1", "start_time": 0.1, "end_time": 0.2, "confidence": 0.95}, ...]
    results = Column(JSON, nullable=True)
    
    # Summary statistics
    total_s1_count = Column(Integer, default=0)
    total_s2_count = Column(Integer, default=0)
    average_confidence = Column(Float, default=0.0)
    heart_rate_bpm = Column(Float, nullable=True)
    
    # ============== OUTPUT FILES ==============
    visualization_url = Column(String(500), nullable=True)
    report_pdf_url = Column(String(500), nullable=True)
    waveform_data = Column(JSON, nullable=True)  # For frontend visualization
    
    # ============== DOCTOR REVIEW ==============
    doctor_comments = Column(Text, nullable=True)
    doctor_reviewed = Column(DateTime, nullable=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_agrees_with_ai = Column(Integer, nullable=True)  # 1=agree, 0=disagree
    doctor_classification = Column(Enum(ClassificationResult), nullable=True)  # Doctor's override
    
    # ============== MODEL METADATA ==============
    model_version = Column(String(50), nullable=True)
    processing_time_seconds = Column(Float, nullable=True)
    
    # ============== TIMESTAMPS ==============
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    pcg_upload = relationship("PCGUpload", back_populates="analysis_results")
    
    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, upload_id={self.upload_id}, classification={self.classification})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "upload_id": self.upload_id,
            "status": "completed",
            
            # AI Classification
            "classification": self.classification.value if self.classification else None,
            "classification_confidence": self.classification_confidence,
            "probability_normal": self.probability_normal,
            "probability_abnormal": self.probability_abnormal,
            
            # S1/S2 Detection
            "results": self.results or [],
            "total_s1_count": self.total_s1_count,
            "total_s2_count": self.total_s2_count,
            "average_confidence": self.average_confidence,
            "heart_rate_bpm": self.heart_rate_bpm,
            
            # Output files
            "visualization_url": self.visualization_url,
            "report_pdf_url": self.report_pdf_url,
            
            # Doctor review
            "doctor_comments": self.doctor_comments or "",
            "doctor_reviewed": self.doctor_reviewed.isoformat() if self.doctor_reviewed else None,
            "doctor_agrees_with_ai": self.doctor_agrees_with_ai,
            "doctor_classification": self.doctor_classification.value if self.doctor_classification else None,
            
            # Metadata
            "model_version": self.model_version,
            "processing_time_seconds": self.processing_time_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }