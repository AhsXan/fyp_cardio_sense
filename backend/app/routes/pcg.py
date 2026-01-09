"""PCG Routes
Handles PCG audio file uploads, status, and results with AI analysis
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import time
import os
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.database import get_db
from app.models.user import User
from app.models.pcg_upload import PCGUpload, UploadStatus
from app.models.analysis_result import AnalysisResult, ClassificationResult
from app.models.researcher_suggestion import ResearcherSuggestion
from app.services.file_service import FileService
from app.utils.security import get_current_user

router = APIRouter(prefix="/pcg", tags=["PCG"])


def run_ai_analysis(file_path: str):
    """
    Run AI analysis on an uploaded PCG file
    Returns classification result with confidence scores
    """
    try:
        from app.services.ai_service import get_classifier
        classifier = get_classifier()
        result = classifier.predict(file_path)
        return result
    except Exception as e:
        print(f"❌ AI Analysis failed: {str(e)}")
        return None


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_pcg(
    file: UploadFile = File(...),
    device: Optional[str] = Form(None),
    recording_time: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PCG audio file for AI analysis.
    The file is automatically analyzed using the heart sound classification model.
    Supports: WAV, MP3, M4A, FLAC (max 10 MB)
    """
    print(f"\n📥 Upload Request Received")
    print(f"   File: {file.filename if file else 'None'}")
    print(f"   User: {current_user.email}")
    print(f"   Device: {device}")
    
    # Validate file
    try:
        is_valid, error_message = FileService.validate_audio_file(file)
        if not is_valid:
            print(f"   ❌ Validation failed: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
    except Exception as e:
        print(f"   ❌ Validation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    
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
        status=UploadStatus.PROCESSING  # Start as processing
    )
    
    db.add(pcg_upload)
    db.commit()
    db.refresh(pcg_upload)
    
    print(f"\n📁 PCG Upload: {file.filename}")
    print(f"   User: {current_user.email}")
    print(f"   Upload ID: {pcg_upload.id}")
    print(f"   Status: PROCESSING (running AI analysis)")
    
    # ============== RUN AI ANALYSIS ==============
    start_time = time.time()
    ai_result = None
    
    # Get absolute path to the uploaded file
    uploads_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    abs_file_path = os.path.join(uploads_dir, "uploads", file_path.replace("/uploads/", "").replace("uploads/", ""))
    
    # Also try alternative path structures
    if not os.path.exists(abs_file_path):
        abs_file_path = os.path.join(uploads_dir, file_path.lstrip("/"))
    if not os.path.exists(abs_file_path):
        abs_file_path = file_path
    
    print(f"   File path for AI: {abs_file_path}")
    
    # Check if file exists and is a WAV file for AI analysis
    if os.path.exists(abs_file_path) and file.filename.lower().endswith('.wav'):
        try:
            ai_result = run_ai_analysis(abs_file_path)
            if ai_result:
                print(f"   🤖 AI Result: {ai_result['label']} ({ai_result['confidence']}%)")
        except Exception as e:
            print(f"   ⚠️ AI Analysis error: {str(e)}")
    else:
        print(f"   ⚠️ File not found or not WAV format, skipping AI analysis")
    
    processing_time = time.time() - start_time
    
    # Create analysis result record
    if ai_result:
        analysis_result = AnalysisResult(
            upload_id=pcg_upload.id,
            classification=ClassificationResult.NORMAL if ai_result['label'] == 'NORMAL' else ClassificationResult.ABNORMAL,
            classification_confidence=ai_result['confidence'],
            probability_normal=ai_result['probabilities']['normal'],
            probability_abnormal=ai_result['probabilities']['abnormal'],
            average_confidence=ai_result['confidence'],
            model_version="hybrid_cnn_lstm_v1.0",
            processing_time_seconds=processing_time
        )
        pcg_upload.status = UploadStatus.COMPLETED
        print(f"   ✅ Analysis completed in {processing_time:.2f}s")
    else:
        # If AI analysis failed, still create a pending result
        analysis_result = AnalysisResult(
            upload_id=pcg_upload.id,
            classification=ClassificationResult.PENDING,
            model_version="pending",
            processing_time_seconds=processing_time
        )
        pcg_upload.status = UploadStatus.COMPLETED  # Still mark as completed
        print(f"   ⚠️ AI analysis pending/failed")
    
    pcg_upload.progress = 100
    pcg_upload.processed_at = datetime.utcnow()
    
    db.add(analysis_result)
    db.commit()
    db.refresh(analysis_result)
    
    return {
        "upload_id": pcg_upload.id,
        "status": "completed",
        "message": "File uploaded and analyzed successfully." if ai_result else "File uploaded. AI analysis pending.",
        "classification": ai_result['label'] if ai_result else None,
        "confidence": ai_result['confidence'] if ai_result else None
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
    Get analysis results for an upload including AI classification
    Accessible by patient (owner) or ANY doctor
    """
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Check access: must be owner OR any doctor
    has_access = False
    if upload.user_id == current_user.id:
        # Patient owns this upload
        has_access = True
    elif current_user.role.value == 'doctor':
        # Any doctor can view any upload
        has_access = True
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this upload"
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
            "classification": None,
            "message": "No results available"
        }
    
    # Return comprehensive results
    response = result.to_dict()
    response["filename"] = upload.original_filename
    response["file_format"] = upload.file_format
    response["device"] = upload.device
    response["uploaded_at"] = upload.created_at.isoformat() if upload.created_at else None
    
    # Get researcher suggestions if any
    suggestions = db.query(ResearcherSuggestion).filter(
        ResearcherSuggestion.upload_id == upload_id
    ).all()
    
    if suggestions:
        response["researcher_suggestions"] = [{
            "suggestion": s.suggestion,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "researcher_id": s.researcher_id
        } for s in suggestions]
    else:
        response["researcher_suggestions"] = []
    
    return response


@router.get("/uploads")
async def get_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of user's PCG uploads with AI classification results
    """
    uploads = db.query(PCGUpload).filter(
        PCGUpload.user_id == current_user.id
    ).order_by(PCGUpload.created_at.desc()).all()
    
    result_list = []
    for u in uploads:
        # Get analysis result for each upload
        analysis = db.query(AnalysisResult).filter(
            AnalysisResult.upload_id == u.id
        ).first()
        
        upload_data = {
            "id": u.id,
            "filename": u.original_filename,
            "status": u.status.value,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "device": u.device,
            "classification": None,
            "confidence": None
        }
        
        if analysis and analysis.classification:
            upload_data["classification"] = analysis.classification.value
            upload_data["confidence"] = analysis.classification_confidence
        
        result_list.append(upload_data)
    
    return {
        "uploads": result_list,
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


@router.get("/{upload_id}/download-report")
async def download_pdf_report(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate and download PDF report for an upload
    Accessible by patient (owner) or ANY doctor
    """
    # Get upload
    upload = db.query(PCGUpload).filter(
        PCGUpload.id == upload_id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Check access: must be owner OR any doctor
    has_access = False
    if upload.user_id == current_user.id:
        has_access = True
    elif current_user.role.value == 'doctor':
        has_access = True
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to download this report"
        )
    
    # Get analysis results
    result = db.query(AnalysisResult).filter(
        AnalysisResult.upload_id == upload_id
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis results not found"
        )
    
    # Get patient info
    patient = db.query(User).filter(User.id == upload.user_id).first()
    
    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1E40AF'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1E40AF'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Title
    story.append(Paragraph("CardioSense Heart Sound Analysis Report", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Patient Information
    story.append(Paragraph("Patient Information", heading_style))
    patient_data = [
        ['Patient Name:', patient.full_name if patient else 'N/A'],
        ['Report Date:', datetime.utcnow().strftime('%B %d, %Y')],
        ['Upload Date:', upload.created_at.strftime('%B %d, %Y') if upload.created_at else 'N/A'],
        ['File Name:', upload.original_filename],
    ]
    patient_table = Table(patient_data, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 0.3*inch))
    
    # AI Classification Result
    story.append(Paragraph("AI Classification Result", heading_style))
    classification = result.classification.value if result.classification else 'PENDING'
    classification_color = colors.HexColor('#059669') if classification == 'NORMAL' else colors.HexColor('#DC2626')
    
    ai_data = [
        ['Classification:', classification],
        ['Confidence:', f"{result.classification_confidence:.1f}%" if result.classification_confidence else 'N/A'],
        ['Normal Probability:', f"{result.probability_normal:.1f}%" if result.probability_normal else 'N/A'],
        ['Abnormal Probability:', f"{result.probability_abnormal:.1f}%" if result.probability_abnormal else 'N/A'],
        ['Model Version:', result.model_version or 'N/A'],
        ['Processing Time:', f"{result.processing_time_seconds:.2f}s" if result.processing_time_seconds else 'N/A'],
    ]
    ai_table = Table(ai_data, colWidths=[2*inch, 4*inch])
    ai_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3F4F6')),
        ('BACKGROUND', (1, 0), (1, 0), classification_color),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(ai_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Doctor's Review (if available)
    if result.doctor_reviewed:
        story.append(Paragraph("Doctor's Review", heading_style))
        doctor = db.query(User).filter(User.id == result.doctor_id).first()
        doctor_data = [
            ['Reviewed By:', f"Dr. {doctor.full_name}" if doctor else 'N/A'],
            ['Review Date:', result.doctor_reviewed.strftime('%B %d, %Y') if result.doctor_reviewed else 'N/A'],
            ['Agrees with AI:', 'Yes' if result.doctor_agrees_with_ai else 'No'],
        ]
        
        if result.doctor_classification:
            doctor_data.append(['Doctor\'s Classification:', result.doctor_classification.value])
        
        doctor_table = Table(doctor_data, colWidths=[2*inch, 4*inch])
        doctor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3F4F6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        story.append(doctor_table)
        
        if result.doctor_comments:
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph("<b>Doctor's Comments:</b>", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph(result.doctor_comments, styles['Normal']))
        
        story.append(Spacer(1, 0.3*inch))
    
    # Researcher Suggestions (if available)
    suggestions = db.query(ResearcherSuggestion).filter(
        ResearcherSuggestion.upload_id == upload_id
    ).all()
    
    if suggestions:
        story.append(Paragraph("Researcher Suggestions", heading_style))
        story.append(Paragraph(
            "<i>Research feedback for improving AI model accuracy and detection methods</i>",
            styles['Normal']
        ))
        story.append(Spacer(1, 0.2*inch))
        
        for idx, suggestion in enumerate(suggestions, 1):
            story.append(Paragraph(f"<b>Suggestion {idx}:</b>", styles['Normal']))
            story.append(Paragraph(suggestion.suggestion, styles['Normal']))
            story.append(Paragraph(
                f"<i>Submitted: {suggestion.created_at.strftime('%B %d, %Y') if suggestion.created_at else 'N/A'}</i>",
                ParagraphStyle('Small', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
            ))
            if idx < len(suggestions):
                story.append(Spacer(1, 0.15*inch))
        
        story.append(Spacer(1, 0.3*inch))
    
    # Disclaimer
    story.append(Spacer(1, 0.5*inch))
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    story.append(Paragraph(
        "<b>Disclaimer:</b> This report is generated by CardioSense AI system and should be used as a diagnostic aid. "
        "Final diagnosis should be made by a qualified healthcare professional.",
        disclaimer_style
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    # Return as streaming response
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=CardioSense_Report_{upload_id}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        }
    )

