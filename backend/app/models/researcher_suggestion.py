"""
Researcher Suggestion Model
Stores researcher feedback and suggestions for AI model improvement
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime

from app.database import Base


class ResearcherSuggestion(Base):
    """
    Researcher Suggestion table - stores researcher feedback on analysis results
    """
    __tablename__ = "researcher_suggestions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("pcg_uploads.id", ondelete="CASCADE"), nullable=False)
    researcher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Suggestion content
    suggestion = Column(Text, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ResearcherSuggestion(id={self.id}, upload_id={self.upload_id})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "upload_id": self.upload_id,
            "researcher_id": self.researcher_id,
            "suggestion": self.suggestion,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
