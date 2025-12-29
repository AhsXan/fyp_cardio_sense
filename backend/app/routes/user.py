"""
User Routes
Handles user profile, settings, 2FA toggle
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserUpdateRequest, Toggle2FARequest, ChangePasswordRequest
from app.utils.security import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile
    """
    return current_user.to_dict()


@router.patch("/profile")
async def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile
    """
    update_data = request.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None and hasattr(current_user, field):
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    print(f"\n📝 Profile Updated: {current_user.email}")
    
    return current_user.to_dict()


@router.post("/toggle-2fa")
async def toggle_2fa(
    request: Toggle2FARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enable or disable two-factor authentication
    """
    current_user.two_fa_enabled = request.enabled
    db.commit()
    
    status_text = "enabled" if request.enabled else "disabled"
    print(f"\n🔐 2FA {status_text} for: {current_user.email}")
    
    return {
        "success": True,
        "enabled": request.enabled,
        "message": f"Two-factor authentication {status_text}"
    }


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check new password match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Update password
    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    
    print(f"\n🔑 Password Changed: {current_user.email}")
    
    return {"success": True, "message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user account (soft delete - mark as suspended)
    """
    from app.models.user import UserStatus
    
    current_user.status = UserStatus.SUSPENDED
    db.commit()
    
    print(f"\n🗑️ Account Deleted: {current_user.email}")
    
    return {"success": True, "message": "Account deleted successfully"}

