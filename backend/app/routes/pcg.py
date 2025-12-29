"""
PCG Routes
Handles PCG audio file uploads, status, and results
NOTE: ML analysis is NOT implemented - will be integrated later
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.pcg_upload import PCGUpload, UploadStatus
from app.models.analysis_result import AnalysisResult
from app.services.file_service import FileService
from app.utils.security import get_current_user

router = APIRouter(prefix="/pcg", tags=["PCG"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_pcg(
    file: UploadFile = File(...),
    device: Optional[str] = Form(None),
    recording_time: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PCG audio file for analysis
    Supports: WAV, MP3, M4A, FLAC (max 10MB)
    """
    # Validate file
    is_valid, error_message = FileService.validate_audio_file(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Save file
    try:
        saved_filename, file_path, file_size = await FileService.save_upload(
            file, current_user.id, "pcg"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Parse recording time if provided
    recording_datetime = None
    if recording_time:
        try:
            recording_datetime = datetime.fromisoformat(recording_time)
        except:
            pass
    
    # Create upload record
    pcg_upload = PCGUpload(
        user_id=current_user.id,
        filename=saved_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_format=FileService.get_file_extension(file.filename),
        device=device,
        recording_time=recording_datetime,
        status=UploadStatus.QUEUED
    )
    
    db.add(pcg_upload)
    db.commit()
    db.refresh(pcg_upload)
    
    print(f"\n📁 PCG Upload: {file.filename}")
    print(f"   User: {current_user.email}")
    print(f"   Upload ID: {pcg_upload.id}")
    print(f"   Status: QUEUED (awaiting ML processing)")
    
    return {
        "upload_id": pcg_upload.id,
        "status": "queued",
        "message": "File uploaded successfully. Analysis will begin shortly."
    }


@router.get("/{upload_id}/status")
async def get_upload_status(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get processing status of an upload
    """
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id,
        PCGUpload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    return {
        "status": upload.status.value,
        "progress": upload.progress
    }


@router.get("/{upload_id}/results")
async def get_upload_results(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analysis results for an upload
    """
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id,
        PCGUpload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    if upload.status != UploadStatus.COMPLETED:
        return {
            "upload_id": upload_id,
            "status": upload.status.value,
            "message": f"Analysis not complete. Current status: {upload.status.value}"
        }
    
    # Get results
    result = db.query(AnalysisResult).filter(
        AnalysisResult.upload_id == upload_id
    ).first()
    
    if not result:
        return {
            "upload_id": upload_id,
            "status": "completed",
            "results": [],
            "message": "No results available (ML not integrated)"
        }
    
    return result.to_dict()


@router.get("/uploads")
async def get_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of user's PCG uploads
    """
    uploads = db.query(PCGUpload).filter(
        PCGUpload.user_id == current_user.id
    ).order_by(PCGUpload.created_at.desc()).all()
    
    return {
        "uploads": [
            {
                "id": u.id,
                "filename": u.original_filename,
                "status": u.status.value,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "device": u.device
            }
            for u in uploads
        ],
        "total": len(uploads)
    }


@router.delete("/{upload_id}")
async def delete_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an upload
    """
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id,
        PCGUpload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Delete file
    FileService.delete_file(upload.file_path)
    
    # Delete database record
    db.delete(upload)
    db.commit()
    
    print(f"\n🗑️ Upload Deleted: {upload.original_filename}")
    
    return {"success": True, "message": "Upload deleted successfully"}


# ============================================================
# PLACEHOLDER FOR ML INTEGRATION
# ============================================================
# When the ML model is ready, implement these functions:
#
# async def process_pcg_file(upload_id: int, file_path: str):
#     """
#     Process PCG file using ML model
#     1. Load audio file
#     2. Preprocess (resample, normalize)
#     3. Run S1/S2 detection model
#     4. Store results in AnalysisResult table
#     5. Update PCGUpload status to COMPLETED
#     """
#     pass
#
# The ML model integration will:
# - Accept WAV/MP3 audio input
# - Detect S1 and S2 heart sounds
# - Return: labels, timestamps, confidence scores
# - Generate visualization data for frontend
# ============================================================


@router.post("/{upload_id}/mock-analyze")
async def mock_analyze(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    TEMPORARY: Mock analysis endpoint for testing
    This simulates what the ML model will do
    """
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id,
        PCGUpload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Update status to processing
    upload.status = UploadStatus.PROCESSING
    upload.progress = 50
    db.commit()
    
    # Create mock results
    mock_results = [
        {"label": "S1", "start_time": 0.1, "end_time": 0.15, "confidence": 0.95},
        {"label": "S2", "start_time": 0.35, "end_time": 0.4, "confidence": 0.92},
        {"label": "S1", "start_time": 0.9, "end_time": 0.95, "confidence": 0.94},
        {"label": "S2", "start_time": 1.15, "end_time": 1.2, "confidence": 0.91},
        {"label": "S1", "start_time": 1.7, "end_time": 1.75, "confidence": 0.96},
        {"label": "S2", "start_time": 1.95, "end_time": 2.0, "confidence": 0.93},
    ]
    
    # Create analysis result
    result = AnalysisResult(
        upload_id=upload_id,
        results=mock_results,
        total_s1_count=3,
        total_s2_count=3,
        average_confidence=0.935,
        heart_rate_bpm=72.5,
        model_version="mock-v1.0",
        processing_time_seconds=2.5
    )
    
    db.add(result)
    
    # Update upload status
    upload.status = UploadStatus.COMPLETED
    upload.progress = 100
    upload.processed_at = datetime.utcnow()
    
    db.commit()
    
    print(f"\n🔬 Mock Analysis Complete: Upload #{upload_id}")
    print(f"   S1 detected: 3, S2 detected: 3")
    print(f"   Heart Rate: 72.5 BPM")
    
    return {
        "success": True,
        "upload_id": upload_id,
        "message": "Mock analysis completed",
        "results_summary": {
            "s1_count": 3,
            "s2_count": 3,
            "heart_rate_bpm": 72.5,
            "confidence": 0.935
        }
    }

