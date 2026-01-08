"""  
AI Testing Routes
Test endpoints for heart sound classification
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import tempfile
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.utils.security import get_current_user

# Note: AI service import is delayed to avoid startup issues if TensorFlow not properly installed

router = APIRouter(prefix="/ai", tags=["AI Testing"])


def require_admin(current_user: User = Depends(get_current_user)):
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.post("/test-predict")
async def test_predict_heart_sound(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Test endpoint for heart sound prediction
    Upload a WAV file and get classification results
    
    **Admin only** - For testing AI model integration
    """
    
    # Validate file type
    if not audio_file.filename.lower().endswith('.wav'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only WAV audio files are supported"
        )
    
    # Create temporary file to save upload
    temp_file_path = None
    
    try:
        # Lazy import AI service
        try:
            from app.services.ai_service import get_classifier
        except Exception as import_error:
            error_msg = str(import_error)
            print(f"❌ AI service import failed: {error_msg}")
            
            # Check if it's the common Windows DLL error
            if "DLL load failed" in error_msg or "DLL initialization" in error_msg:
                detail_msg = (
                    "TensorFlow DLL initialization failed on Windows. "
                    "This is a common issue. To fix it:\n\n"
                    "Option 1 (Recommended): Install Microsoft Visual C++ Redistributable\n"
                    "   Download: https://aka.ms/vs/16/release/vc_redist.x64.exe\n\n"
                    "Option 2: Use tensorflow-cpu instead\n"
                    "   Run: pip uninstall tensorflow && pip install tensorflow-cpu==2.15.0\n\n"
                    "Option 3: Test the model directly via Python script (see backend/test_ai_with_audio.py)\n\n"
                    f"Technical details: {error_msg[:200]}"
                )
            else:
                detail_msg = f"AI service unavailable: {error_msg}. Please ensure TensorFlow is properly installed."
            
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=detail_msg
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        print(f"\n🎵 Testing AI prediction on: {audio_file.filename}")
        print(f"📁 Temp file: {temp_file_path}")
        print(f"📊 File size: {len(content)} bytes")
        print(f"👤 Requested by: {current_user.email}")
        
        # Get classifier and make prediction
        try:
            classifier = get_classifier()
            print("✅ Classifier loaded")
        except Exception as classifier_error:
            print(f"❌ Classifier loading failed: {str(classifier_error)}")
            import traceback
            traceback.print_exc()
            raise
        
        try:
            result = classifier.predict(temp_file_path)
            print(f"✅ Prediction complete")
        except Exception as predict_error:
            print(f"❌ Prediction failed: {str(predict_error)}")
            import traceback
            traceback.print_exc()
            raise
        
        # Add metadata
        response = {
            "success": True,
            "filename": audio_file.filename,
            "prediction": result,
            "timestamp": datetime.utcnow().isoformat(),
            "tested_by": current_user.email
        }
        
        print(f"✅ Prediction successful: {result['label']} ({result['confidence']}%)")
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Unexpected error in AI prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI prediction failed: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"🗑️ Cleaned up temp file")
            except Exception as cleanup_error:
                print(f"⚠️ Failed to cleanup temp file: {str(cleanup_error)}")


@router.get("/model-status")
async def get_model_status(
    current_user: User = Depends(require_admin)
):
    """
    Check if AI model is loaded and ready
    
    **Admin only**
    """
    try:
        from app.services.ai_service import get_classifier
        classifier = get_classifier()
        return {
            "status": "ready",
            "model_loaded": True,
            "config": {
                "sampling_rate": classifier.FS_TARGET,
                "duration": classifier.DURATION,
                "analog_length": classifier.ANALOG_LEN,
                "mfcc_length": classifier.MFCC_LEN,
                "mfcc_coefficients": classifier.N_MFCC
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "model_loaded": False,
            "error": str(e)
        }
