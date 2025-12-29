"""
PCG Schemas - Request/Response models for PCG upload endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PCGUploadResponse(BaseModel):
    """PCG upload response"""
    upload_id: int
    status: str = "queued"
    message: str = "File uploaded successfully"


class PCGStatusResponse(BaseModel):
    """PCG upload status response"""
    status: str  # queued, processing, completed, failed
    progress: int = 0  # 0-100


class PCGResultItem(BaseModel):
    """Single result item in analysis"""
    label: str  # S1 or S2
    start_time: float
    end_time: float
    confidence: float


class PCGResultsResponse(BaseModel):
    """PCG analysis results response"""
    upload_id: int
    status: str
    results: List[PCGResultItem] = []
    visualization_url: Optional[str] = None
    report_pdf_url: Optional[str] = None
    comments: str = ""
    total_s1_count: int = 0
    total_s2_count: int = 0
    average_confidence: float = 0.0
    heart_rate_bpm: Optional[float] = None


class PCGUploadItem(BaseModel):
    """Single upload item in list"""
    id: int
    filename: str
    status: str
    created_at: str
    device: Optional[str] = None


class PCGListResponse(BaseModel):
    """List of user's PCG uploads"""
    uploads: List[PCGUploadItem] = []
    total: int = 0


class PCGUpdateRequest(BaseModel):
    """Update PCG upload (e.g., add doctor notes)"""
    doctor_notes: Optional[str] = None
    status: Optional[str] = None
