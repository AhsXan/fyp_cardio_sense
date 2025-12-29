"""
Doctor Routes
Handles patient management, PCG approvals
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.pcg_upload import PCGUpload, UploadStatus
from app.models.doctor_patient import DoctorPatient, AssignmentStatus
from app.models.analysis_result import AnalysisResult
from app.utils.security import require_doctor

router = APIRouter(prefix="/doctor", tags=["Doctor"])


@router.get("/patients")
async def get_patients(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Get list of patients assigned to doctor
    """
    # Get assigned patients
    assignments = db.query(DoctorPatient).filter(
        DoctorPatient.doctor_id == current_user.id,
        DoctorPatient.status == AssignmentStatus.ACTIVE
    ).all()
    
    patients = []
    for assignment in assignments:
        patient = db.query(User).filter(User.id == assignment.patient_id).first()
        if patient:
            patients.append({
                "id": patient.id,
                "full_name": patient.full_name,
                "email": patient.email,
                "phone": patient.phone,
                "gender": patient.gender,
                "blood_group": patient.blood_group,
                "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None
            })
    
    return {"patients": patients}


@router.get("/pending-approvals")
async def get_pending_approvals(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Get pending PCG upload approvals for assigned patients
    """
    # Get all assigned patient IDs
    assignments = db.query(DoctorPatient).filter(
        DoctorPatient.doctor_id == current_user.id,
        DoctorPatient.status == AssignmentStatus.ACTIVE
    ).all()
    
    patient_ids = [a.patient_id for a in assignments]
    
    # Get pending uploads from assigned patients
    pending_uploads = db.query(PCGUpload).filter(
        PCGUpload.user_id.in_(patient_ids),
        PCGUpload.status == UploadStatus.PENDING_APPROVAL
    ).all()
    
    approvals = []
    for upload in pending_uploads:
        patient = db.query(User).filter(User.id == upload.user_id).first()
        approvals.append({
            "id": upload.id,
            "patient_id": upload.user_id,
            "patient_name": patient.full_name if patient else "Unknown",
            "filename": upload.original_filename,
            "upload_date": upload.created_at.isoformat() if upload.created_at else None,
            "status": upload.status.value
        })
    
    return {"approvals": approvals}


@router.post("/approve-patient/{patient_id}")
async def approve_patient_upload(
    patient_id: int,
    upload_id: Optional[int] = Query(None),
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Approve a patient's PCG upload
    """
    # Verify patient is assigned to this doctor
    assignment = db.query(DoctorPatient).filter(
        DoctorPatient.doctor_id == current_user.id,
        DoctorPatient.patient_id == patient_id,
        DoctorPatient.status == AssignmentStatus.ACTIVE
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient not assigned to you"
        )
    
    # Get upload(s) to approve
    if upload_id:
        uploads = db.query(PCGUpload).filter(
            PCGUpload.id == upload_id,
            PCGUpload.user_id == patient_id
        ).all()
    else:
        uploads = db.query(PCGUpload).filter(
            PCGUpload.user_id == patient_id,
            PCGUpload.status == UploadStatus.PENDING_APPROVAL
        ).all()
    
    for upload in uploads:
        upload.status = UploadStatus.COMPLETED
        upload.assigned_doctor_id = current_user.id
    
    db.commit()
    
    print(f"\n✅ Doctor {current_user.email} approved uploads for patient ID: {patient_id}")
    
    return {"success": True, "patient_id": patient_id, "approved_count": len(uploads)}


@router.get("/patient/{patient_id}/uploads")
async def get_patient_uploads(
    patient_id: int,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Get all uploads for a specific patient
    """
    # Verify patient is assigned to this doctor
    assignment = db.query(DoctorPatient).filter(
        DoctorPatient.doctor_id == current_user.id,
        DoctorPatient.patient_id == patient_id,
        DoctorPatient.status == AssignmentStatus.ACTIVE
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient not assigned to you"
        )
    
    uploads = db.query(PCGUpload).filter(
        PCGUpload.user_id == patient_id
    ).order_by(PCGUpload.created_at.desc()).all()
    
    return {"uploads": [u.to_dict() for u in uploads]}


@router.get("/patient/{patient_id}/results/{upload_id}")
async def get_patient_results(
    patient_id: int,
    upload_id: int,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Get analysis results for a patient's upload
    """
    # Verify patient is assigned to this doctor
    assignment = db.query(DoctorPatient).filter(
        DoctorPatient.doctor_id == current_user.id,
        DoctorPatient.patient_id == patient_id,
        DoctorPatient.status == AssignmentStatus.ACTIVE
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient not assigned to you"
        )
    
    # Get upload
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id,
        PCGUpload.user_id == patient_id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Get results
    results = db.query(AnalysisResult).filter(
        AnalysisResult.upload_id == upload_id
    ).first()
    
    return {
        "upload": upload.to_dict(),
        "results": results.to_dict() if results else None
    }


@router.post("/add-comment/{upload_id}")
async def add_doctor_comment(
    upload_id: int,
    comment: str,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Add doctor comment to an upload's results
    """
    result = db.query(AnalysisResult).filter(
        AnalysisResult.upload_id == upload_id
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Results not found"
        )
    
    result.doctor_comments = comment
    db.commit()
    
    print(f"\n💬 Doctor Comment Added: Upload #{upload_id}")
    
    return {"success": True, "message": "Comment added successfully"}
