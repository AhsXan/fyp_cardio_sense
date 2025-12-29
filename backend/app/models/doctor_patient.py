"""
Doctor-Patient Relationship Model
Handles assignment of patients to doctors
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, Text
from datetime import datetime
import enum

from app.database import Base


class AssignmentStatus(str, enum.Enum):
    """Status of doctor-patient assignment"""
    PENDING = "pending"  # Waiting for doctor to accept
    ACTIVE = "active"  # Doctor is managing patient
    COMPLETED = "completed"  # Treatment finished
    REJECTED = "rejected"  # Doctor rejected assignment


class DoctorPatient(Base):
    """
    Doctor-Patient relationship table
    Links doctors with their patients
    """
    __tablename__ = "doctor_patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Assignment details
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    assigned_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<DoctorPatient(doctor_id={self.doctor_id}, patient_id={self.patient_id})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "patient_id": self.patient_id,
            "status": self.status.value if self.status else None,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
        }
