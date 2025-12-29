"""
Admin Schemas - Request/Response models for admin endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AdminUserItem(BaseModel):
    """Single user item for admin list"""
    id: int
    email: str
    full_name: str
    role: str
    status: str
    email_verified: bool
    created_at: Optional[str] = None
    last_login: Optional[str] = None


class AdminUserListResponse(BaseModel):
    """Admin user list response"""
    users: List[AdminUserItem] = []
    total: int = 0
    page: int = 1
    per_page: int = 20


class AdminUserActionRequest(BaseModel):
    """Admin action on user (verify, suspend, etc.)"""
    action: str = Field(..., description="Action: verify, suspend, activate, reject, delete")
    reason: Optional[str] = None


class AdminUserActionResponse(BaseModel):
    """Admin action response"""
    success: bool
    user_id: int
    action: str
    message: str


class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics"""
    total_users: int = 0
    total_patients: int = 0
    total_doctors: int = 0
    total_researchers: int = 0
    pending_verifications: int = 0
    total_uploads: int = 0
    uploads_today: int = 0
    active_sessions: int = 0


class AdminPendingApproval(BaseModel):
    """Pending approval item (doctor/researcher)"""
    id: int
    email: str
    full_name: str
    role: str
    status: str
    created_at: Optional[str] = None
    # Role-specific
    license_number: Optional[str] = None
    license_document_path: Optional[str] = None
    institution: Optional[str] = None
    affiliation_document_path: Optional[str] = None


class AdminPendingListResponse(BaseModel):
    """List of pending approvals"""
    approvals: List[AdminPendingApproval] = []
    total: int = 0


class AdminDatasetCreateRequest(BaseModel):
    """Create new dataset request"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    requires_approval: bool = True


class AdminDatasetAccessReview(BaseModel):
    """Review dataset access request"""
    action: str = Field(..., description="Action: approve, reject")
    notes: Optional[str] = None
    expires_days: Optional[int] = 365  # Access expiry in days
