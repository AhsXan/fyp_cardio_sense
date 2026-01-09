"""
Researcher Routes
Handles dataset access and requests
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.dataset import Dataset, DatasetAccess, DatasetStatus, AccessRequestStatus
from app.models.pcg_upload import PCGUpload
from app.models.analysis_result import AnalysisResult
from app.models.researcher_suggestion import ResearcherSuggestion
from app.utils.security import require_researcher

router = APIRouter(prefix="/researcher", tags=["Researcher"])


class DatasetAccessRequest(BaseModel):
    dataset_id: int
    purpose: Optional[str] = None


@router.get("/datasets")
async def get_available_datasets(
    current_user: User = Depends(require_researcher),
    db: Session = Depends(get_db)
):
    """
    Get available datasets for researcher
    """
    datasets = db.query(Dataset).filter(
        Dataset.status != DatasetStatus.ARCHIVED
    ).all()
    
    result = []
    for dataset in datasets:
        # Check if researcher has requested access
        access = db.query(DatasetAccess).filter(
            DatasetAccess.dataset_id == dataset.id,
            DatasetAccess.researcher_id == current_user.id
        ).first()
        
        status = "available"
        if access:
            status = access.status.value
        
        result.append({
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "total_samples": dataset.total_samples,
            "status": status
        })
    
    return {"datasets": result}


@router.post("/request-dataset-access")
async def request_dataset_access(
    request: DatasetAccessRequest,
    current_user: User = Depends(require_researcher),
    db: Session = Depends(get_db)
):
    """
    Request access to a dataset
    """
    # Check if dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Check if already requested
    existing = db.query(DatasetAccess).filter(
        DatasetAccess.dataset_id == request.dataset_id,
        DatasetAccess.researcher_id == current_user.id
    ).first()
    
    if existing:
        if existing.status == AccessRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access already granted"
            )
        elif existing.status == AccessRequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access request already pending"
            )
    
    # Create access request
    access_request = DatasetAccess(
        dataset_id=request.dataset_id,
        researcher_id=current_user.id,
        purpose=request.purpose,
        status=AccessRequestStatus.PENDING
    )
    
    db.add(access_request)
    db.commit()
    
    print(f"\n📊 Dataset Access Request: {current_user.email} -> {dataset.name}")
    
    return {"success": True, "dataset_id": request.dataset_id, "message": "Access request submitted"}


@router.get("/my-access")
async def get_my_access(
    current_user: User = Depends(require_researcher),
    db: Session = Depends(get_db)
):
    """
    Get list of datasets researcher has access to
    """
    access_list = db.query(DatasetAccess).filter(
        DatasetAccess.researcher_id == current_user.id
    ).all()
    
    result = []
    for access in access_list:
        dataset = db.query(Dataset).filter(Dataset.id == access.dataset_id).first()
        result.append({
            "dataset_id": access.dataset_id,
            "dataset_name": dataset.name if dataset else "Unknown",
            "status": access.status.value,
            "requested_at": access.requested_at.isoformat() if access.requested_at else None,
            "expires_at": access.expires_at.isoformat() if access.expires_at else None
        })
    
    return {"access": result}


@router.get("/dataset/{dataset_id}/download")
async def download_dataset(
    dataset_id: int,
    current_user: User = Depends(require_researcher),
    db: Session = Depends(get_db)
):
    """
    Get download link for dataset (if access approved)
    """
    # Check access
    access = db.query(DatasetAccess).filter(
        DatasetAccess.dataset_id == dataset_id,
        DatasetAccess.researcher_id == current_user.id,
        DatasetAccess.status == AccessRequestStatus.APPROVED
    ).first()
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this dataset"
        )
    
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    if not dataset or not dataset.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file not found"
        )
    
    # In production, return a signed URL or stream the file
    return {
        "dataset_id": dataset_id,
        "name": dataset.name,
        "file_path": dataset.file_path,
        "message": "Download URL generated (in production, this would be a signed URL)"
    }


@router.get("/reviewed-results")
async def get_reviewed_results(
    current_user: User = Depends(require_researcher),
    db: Session = Depends(get_db)
):
    """
    Get all doctor-reviewed analysis results for research
    """
    try:
        # Get all uploads that have been reviewed by doctors
        results = db.query(AnalysisResult).filter(
            AnalysisResult.doctor_classification.isnot(None)
        ).all()
        
        result_list = []
        for result in results:
            # Get upload and user info
            upload = db.query(PCGUpload).filter(PCGUpload.id == result.upload_id).first()
            if not upload:
                continue
                
            user = db.query(User).filter(User.id == upload.user_id).first()
            
            # Check if researcher has already provided suggestion
            try:
                suggestion = db.query(ResearcherSuggestion).filter(
                    ResearcherSuggestion.upload_id == upload.id,
                    ResearcherSuggestion.researcher_id == current_user.id
                ).first()
            except Exception as e:
                # If table doesn't exist yet, continue without suggestions
                print(f"Warning: Could not query suggestions: {e}")
                suggestion = None
            
            result_list.append({
                "upload_id": upload.id,
                "patient_name": user.full_name if user else "Unknown",
                "ai_classification": result.classification.value if result.classification else None,
                "doctor_classification": result.doctor_classification.value if result.doctor_classification else None,
                "doctor_comments": result.doctor_comments,
                "classification_confidence": result.classification_confidence,
                "created_at": upload.created_at.isoformat() if upload.created_at else None,
                "researcher_suggestion": suggestion.suggestion if suggestion else None
            })
        
        return {"results": result_list}
    except Exception as e:
        print(f"\n❌ Error in get_reviewed_results: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reviewed results: {str(e)}"
        )


@router.post("/suggest/{upload_id}")
async def submit_suggestion(
    upload_id: int,
    suggestion: str = Body(..., embed=True),
    current_user: User = Depends(require_researcher),
    db: Session = Depends(get_db)
):
    """
    Submit improvement suggestion for an analysis result
    """
    # Check if upload exists
    upload = db.query(PCGUpload).filter(PCGUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Check if analysis exists and has doctor review
    analysis = db.query(AnalysisResult).filter(
        AnalysisResult.upload_id == upload_id
    ).first()
    
    if not analysis or not analysis.doctor_classification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This result has not been reviewed by a doctor yet"
        )
    
    # Check if suggestion already exists
    existing = db.query(ResearcherSuggestion).filter(
        ResearcherSuggestion.upload_id == upload_id,
        ResearcherSuggestion.researcher_id == current_user.id
    ).first()
    
    if existing:
        # Update existing suggestion
        existing.suggestion = suggestion
        existing.updated_at = datetime.utcnow()
        db.commit()
        print(f"\n📝 Researcher Suggestion Updated: Upload #{upload_id}")
    else:
        # Create new suggestion
        new_suggestion = ResearcherSuggestion(
            upload_id=upload_id,
            researcher_id=current_user.id,
            suggestion=suggestion
        )
        db.add(new_suggestion)
        db.commit()
        print(f"\n📝 Researcher Suggestion Added: Upload #{upload_id}")
    
    return {"success": True, "message": "Suggestion submitted successfully"}
