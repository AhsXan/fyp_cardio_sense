"""
File Service - Handles file uploads and storage
"""
import os
import uuid
import aiofiles
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
ALLOWED_AUDIO_EXTENSIONS = os.getenv("ALLOWED_AUDIO_EXTENSIONS", "wav,mp3,m4a,flac").split(",")


class FileService:
    """
    Service for file operations
    - Validate files
    - Save uploads
    - Manage file paths
    """
    
    @staticmethod
    def ensure_upload_dir():
        """Ensure upload directory exists"""
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Extract file extension from filename"""
        return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    @staticmethod
    def validate_audio_file(file: UploadFile) -> Tuple[bool, str]:
        """
        Validate an audio file upload
        Returns: (is_valid, error_message)
        """
        # Check if file exists
        if not file or not file.filename:
            return False, "No file provided"
        
        # Check file extension
        extension = FileService.get_file_extension(file.filename)
        if extension not in ALLOWED_AUDIO_EXTENSIONS:
            return False, f"Invalid file type. Allowed: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        
        # Check content type (basic check)
        if file.content_type and not file.content_type.startswith(('audio/', 'application/octet-stream')):
            return False, "Invalid content type. Must be an audio file"
        
        return True, ""
    
    @staticmethod
    async def save_upload(
        file: UploadFile,
        user_id: int,
        subfolder: str = "pcg"
    ) -> Tuple[str, str, int]:
        """
        Save an uploaded file
        Returns: (saved_filename, file_path, file_size)
        """
        FileService.ensure_upload_dir()
        
        # Create user-specific subfolder
        user_folder = os.path.join(UPLOAD_DIR, subfolder, str(user_id))
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)
        
        # Generate unique filename
        extension = FileService.get_file_extension(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        saved_filename = f"{timestamp}_{unique_id}.{extension}"
        file_path = os.path.join(user_folder, saved_filename)
        
        # Check file size while saving
        file_size = 0
        max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
        
        try:
            async with aiofiles.open(file_path, 'wb') as out_file:
                while True:
                    chunk = await file.read(1024 * 1024)  # Read 1MB at a time
                    if not chunk:
                        break
                    file_size += len(chunk)
                    if file_size > max_size_bytes:
                        # File too large, clean up
                        await out_file.close()
                        os.remove(file_path)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
                        )
                    await out_file.write(chunk)
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e
        
        return saved_filename, file_path, file_size
    
    @staticmethod
    async def save_document(
        file: UploadFile,
        user_id: int,
        doc_type: str = "license"
    ) -> Tuple[str, str]:
        """
        Save a document upload (license, affiliation, etc.)
        Returns: (saved_filename, file_path)
        """
        FileService.ensure_upload_dir()
        
        # Create documents subfolder
        doc_folder = os.path.join(UPLOAD_DIR, "documents", str(user_id))
        if not os.path.exists(doc_folder):
            os.makedirs(doc_folder)
        
        # Generate unique filename
        extension = FileService.get_file_extension(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_filename = f"{doc_type}_{timestamp}.{extension}"
        file_path = os.path.join(doc_folder, saved_filename)
        
        # Save file
        try:
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as out_file:
                await out_file.write(content)
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e
        
        return saved_filename, file_path
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete a file
        Returns: True if deleted, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except:
            pass
        return False
    
    @staticmethod
    def get_file_info(file_path: str) -> Optional[dict]:
        """
        Get file information
        """
        if not os.path.exists(file_path):
            return None
        
        stats = os.stat(file_path)
        return {
            "path": file_path,
            "size": stats.st_size,
            "created": datetime.fromtimestamp(stats.st_ctime),
            "modified": datetime.fromtimestamp(stats.st_mtime),
        }
