"""
Analysis Result Model - Stores AI/ML analysis results for PCG uploads
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class AnalysisResult(Base):
    """
    Analysis Result table - stores S1/S2 detection results
    This will be populated by the ML model (to be integrated later)
    """
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("pcg_uploads.id", ondelete="CASCADE"), nullable=False)
    
    # Analysis results stored as JSON
    # Format: [{"label": "S1", "start_time": 0.1, "end_time": 0.2, "confidence": 0.95}, ...]
    results = Column(JSON, nullable=True)
    
    # Summary statistics
    total_s1_count = Column(Integer, default=0)
    total_s2_count = Column(Integer, default=0)
    average_confidence = Column(Float, default=0.0)
    heart_rate_bpm = Column(Float, nullable=True)
    
    # Output files
    visualization_url = Column(String(500), nullable=True)
    report_pdf_url = Column(String(500), nullable=True)
    waveform_data = Column(JSON, nullable=True)  # For frontend visualization
    
    # Doctor feedback
    doctor_comments = Column(Text, nullable=True)
    doctor_approved = Column(DateTime, nullable=True)
    
    # Model metadata (for tracking which model version was used)
    model_version = Column(String(50), nullable=True)
    processing_time_seconds = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    pcg_upload = relationship("PCGUpload", back_populates="analysis_results")
    
    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, upload_id={self.upload_id})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "upload_id": self.upload_id,
            "status": "completed",
            "results": self.results or [],
            "visualization_url": self.visualization_url,
            "report_pdf_url": self.report_pdf_url,
            "comments": self.doctor_comments or "",
            "total_s1_count": self.total_s1_count,
            "total_s2_count": self.total_s2_count,
            "average_confidence": self.average_confidence,
            "heart_rate_bpm": self.heart_rate_bpm,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
