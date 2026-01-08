"""
Admin Routes
Handles user management, verification, approvals, statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.pcg_upload import PCGUpload
from app.models.dataset import Dataset, DatasetAccess, AccessRequestStatus
from app.schemas.admin import (
    AdminUserListResponse, AdminUserItem,
    AdminUserActionRequest, AdminUserActionResponse,
    AdminStatsResponse,
    AdminPendingListResponse, AdminPendingApproval,
    AdminDatasetCreateRequest, AdminDatasetAccessReview
)
from app.utils.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard statistics
    """
    today = datetime.utcnow().date()
    
    # Exclude rejected users from counts
    total_users = db.query(User).filter(
        User.role != UserRole.ADMIN,
        User.status != UserStatus.REJECTED
    ).count()
    total_patients = db.query(User).filter(
        User.role == UserRole.PATIENT,
        User.status != UserStatus.REJECTED
    ).count()
    total_doctors = db.query(User).filter(
        User.role == UserRole.DOCTOR,
        User.status != UserStatus.REJECTED
    ).count()
    total_researchers = db.query(User).filter(
        User.role == UserRole.RESEARCHER,
        User.status != UserStatus.REJECTED
    ).count()
    pending_verifications = db.query(User).filter(User.status == UserStatus.PENDING).count()
    total_uploads = db.query(PCGUpload).count()
    uploads_today = db.query(PCGUpload).filter(
        func.date(PCGUpload.created_at) == today
    ).count()
    
    return AdminStatsResponse(
        total_users=total_users,
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_researchers=total_researchers,
        pending_verifications=pending_verifications,
        total_uploads=total_uploads,
        uploads_today=uploads_today,
        active_sessions=0  # TODO: Implement session tracking
    )


@router.get("/users", response_model=AdminUserListResponse)
async def get_all_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get list of all users with filtering
    """
    query = db.query(User).filter(User.role != UserRole.ADMIN)
    
    # Apply filters
    if role:
        try:
            query = query.filter(User.role == UserRole(role))
        except ValueError:
            pass
    
    if status:
        try:
            query = query.filter(User.status == UserStatus(status))
        except ValueError:
            pass
    
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    # Get total count
    total = query.count()
    
    # Paginate
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    user_items = [
        AdminUserItem(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            status=u.status.value,
            email_verified=u.email_verified,
            created_at=u.created_at.isoformat() if u.created_at else None,
            last_login=u.last_login.isoformat() if u.last_login else None
        )
        for u in users
    ]
    
    return AdminUserListResponse(
        users=user_items,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed user information
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user.to_dict()


@router.post("/users/{user_id}/action", response_model=AdminUserActionResponse)
async def user_action(
    user_id: int,
    request: AdminUserActionRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Perform action on user: verify, suspend, activate, reject, delete
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    action = request.action.lower()
    message = ""
    
    if action == "verify":
        user.email_verified = True
        user.status = UserStatus.ACTIVE
        message = f"User {user.email} has been verified and activated"
        
    elif action == "suspend":
        user.status = UserStatus.SUSPENDED
        message = f"User {user.email} has been suspended"
        
    elif action == "activate":
        user.status = UserStatus.ACTIVE
        message = f"User {user.email} has been activated"
        
    elif action == "reject":
        user.status = UserStatus.REJECTED
        message = f"User {user.email} has been rejected"
        
    elif action == "delete":
        db.delete(user)
        db.commit()
        message = f"User has been deleted"
        print(f"\n🗑️ Admin deleted user: {user.email}")
        return AdminUserActionResponse(
            success=True,
            user_id=user_id,
            action=action,
            message=message
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action. Allowed: verify, suspend, activate, reject, delete"
        )
    
    db.commit()
    print(f"\n👑 Admin Action: {action.upper()} on {user.email}")
    
    return AdminUserActionResponse(
        success=True,
        user_id=user_id,
        action=action,
        message=message
    )


@router.get("/pending-approvals", response_model=AdminPendingListResponse)
async def get_pending_approvals(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get list of pending doctor/researcher approvals
    """
    pending = db.query(User).filter(
        User.status == UserStatus.PENDING,
        User.role.in_([UserRole.DOCTOR, UserRole.RESEARCHER]),
        User.email_verified == True
    ).order_by(User.created_at.asc()).all()
    
    approvals = [
        AdminPendingApproval(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            status=u.status.value,
            created_at=u.created_at.isoformat() if u.created_at else None,
            license_number=u.license_number,
            license_document_path=u.license_document_path,
            institution=u.institution,
            affiliation_document_path=u.affiliation_document_path
        )
        for u in pending
    ]
    
    return AdminPendingListResponse(approvals=approvals, total=len(approvals))


@router.get("/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get recent activity logs from the system
    """
    from sqlalchemy import desc, union_all, select, literal
    
    activities = []
    
    # Recent user signups (last 7 days)
    recent_signups = db.query(User).filter(
        User.created_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(desc(User.created_at)).limit(limit).all()
    
    for user in recent_signups:
        activities.append({
            'type': 'user_signup',
            'title': 'New user registration',
            'description': f"{user.full_name} registered as a {user.role.value}",
            'timestamp': user.created_at.isoformat() if user.created_at else None
        })
    
    # Recent user approvals/rejections
    recent_actions = db.query(User).filter(
        User.status.in_([UserStatus.ACTIVE, UserStatus.REJECTED]),
        User.role.in_([UserRole.DOCTOR, UserRole.RESEARCHER]),
        User.updated_at >= datetime.utcnow() - timedelta(days=7)
    ).order_by(desc(User.updated_at)).limit(limit).all()
    
    for user in recent_actions:
        if user.status == UserStatus.ACTIVE:
            activities.append({
                'type': 'user_approved',
                'title': 'Verification approved',
                'description': f"{user.full_name}'s {user.role.value} credentials verified",
                'timestamp': user.updated_at.isoformat() if user.updated_at else None
            })
        elif user.status == UserStatus.REJECTED:
            activities.append({
                'type': 'user_rejected',
                'title': 'Verification rejected',
                'description': f"{user.full_name}'s {user.role.value} application rejected",
                'timestamp': user.updated_at.isoformat() if user.updated_at else None
            })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x['timestamp'] if x['timestamp'] else '', reverse=True)
    
    return {"activities": activities[:limit]}


@router.post("/approve/{user_id}")
async def approve_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Approve a pending doctor/researcher
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.status != UserStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not pending approval"
        )
    
    user.status = UserStatus.ACTIVE
    db.commit()
    
    print(f"\n✅ Admin Approved: {user.email} ({user.role.value})")
    
    return {"success": True, "message": f"{user.role.value.capitalize()} approved successfully"}


@router.post("/reject/{user_id}")
async def reject_user(
    user_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Reject a pending doctor/researcher
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.status = UserStatus.REJECTED
    db.commit()
    
    print(f"\n❌ Admin Rejected: {user.email} ({user.role.value})")
    if reason:
        print(f"   Reason: {reason}")
    
    return {"success": True, "message": f"{user.role.value.capitalize()} rejected"}


# Dataset management
@router.post("/datasets")
async def create_dataset(
    request: AdminDatasetCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new dataset for researchers
    """
    dataset = Dataset(
        name=request.name,
        description=request.description,
        requires_approval=1 if request.requires_approval else 0,
        created_by=current_user.id
    )
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    print(f"\n📊 Dataset Created: {dataset.name}")
    
    return {"success": True, "dataset_id": dataset.id, "name": dataset.name}


@router.get("/datasets")
async def get_all_datasets(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all datasets
    """
    datasets = db.query(Dataset).all()
    return {"datasets": [d.to_dict() for d in datasets]}


@router.get("/dataset-access-requests")
async def get_dataset_access_requests(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get pending dataset access requests
    """
    requests = db.query(DatasetAccess).filter(
        DatasetAccess.status == AccessRequestStatus.PENDING
    ).all()
    
    result = []
    for req in requests:
        researcher = db.query(User).filter(User.id == req.researcher_id).first()
        dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
        
        result.append({
            "id": req.id,
            "researcher_email": researcher.email if researcher else "Unknown",
            "researcher_name": researcher.full_name if researcher else "Unknown",
            "dataset_name": dataset.name if dataset else "Unknown",
            "purpose": req.purpose,
            "requested_at": req.requested_at.isoformat() if req.requested_at else None
        })
    
    return {"requests": result, "total": len(result)}


@router.post("/dataset-access/{request_id}/review")
async def review_dataset_access(
    request_id: int,
    review: AdminDatasetAccessReview,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Approve or reject dataset access request
    """
    access_request = db.query(DatasetAccess).filter(DatasetAccess.id == request_id).first()
    
    if not access_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )
    
    if review.action.lower() == "approve":
        access_request.status = AccessRequestStatus.APPROVED
        access_request.reviewed_by = current_user.id
        access_request.reviewed_at = datetime.utcnow()
        access_request.review_notes = review.notes
        if review.expires_days:
            access_request.expires_at = datetime.utcnow() + timedelta(days=review.expires_days)
        message = "Access request approved"
    elif review.action.lower() == "reject":
        access_request.status = AccessRequestStatus.REJECTED
        access_request.reviewed_by = current_user.id
        access_request.reviewed_at = datetime.utcnow()
        access_request.review_notes = review.notes
        message = "Access request rejected"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'approve' or 'reject'"
        )
    
    db.commit()
    
    print(f"\n📊 Dataset Access {review.action}: Request #{request_id}")
    
    return {"success": True, "message": message}
