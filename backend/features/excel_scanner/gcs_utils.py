"""
Google Cloud Storage Utilities for Excel Scanner
"""
import logging
from typing import Optional, Dict, Any
from pathlib import Path

# Import from utils.gcs_storage module
try:
    from utils.gcs_storage import (
        upload_to_gcs,
        upload_dataframe_to_gcs,
        upload_json_to_gcs,
        get_gcs_client,
        GCS_AVAILABLE,
        GCS_BUCKET_NAME,
        GCS_RAW_FOLDER,
        GCS_PROCESSED_FOLDER,
        GCS_SCHEMA_FOLDER
    )
    GCS_ENABLED = GCS_AVAILABLE
except ImportError as e:
    logging.warning(f"Could not import GCS utilities: {e}")
    GCS_ENABLED = False
    GCS_BUCKET_NAME = None
    GCS_RAW_FOLDER = None
    GCS_PROCESSED_FOLDER = None
    GCS_SCHEMA_FOLDER = None

logger = logging.getLogger(__name__)


class GCSService:
    """Service for Google Cloud Storage operations"""
    
    @staticmethod
    def is_available() -> bool:
        """Check if GCS is available"""
        return GCS_ENABLED
    
    @staticmethod
    def upload_excel_file(
        file_content: bytes,
        filename: str,
        bucket_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Upload Excel file to GCS raw folder
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            bucket_name: GCS bucket name (optional)
            
        Returns:
            Dict with GCS info or None if failed
        """
        if not GCS_ENABLED:
            logger.warning("GCS is not available")
            return None
        
        try:
            bucket = bucket_name or GCS_BUCKET_NAME
            gcs_path = f"{GCS_RAW_FOLDER}/{filename}"
            
            result = upload_to_gcs(
                file_content=file_content,
                destination_blob_name=gcs_path,
                bucket_name=bucket
            )
            
            if result:
                return {
                    "bucket": bucket,
                    "path": gcs_path,
                    "url": f"gs://{bucket}/{gcs_path}",
                    "uploaded_at": result.get("uploaded_at")
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to upload file to GCS: {e}")
            return None
    
    @staticmethod
    def upload_scan_result(
        scan_result: Dict[str, Any],
        filename: str,
        bucket_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Upload scan result JSON to GCS
        
        Args:
            scan_result: Scan result dictionary
            filename: Base filename (will add .json extension)
            bucket_name: GCS bucket name (optional)
            
        Returns:
            Dict with GCS info or None if failed
        """
        if not GCS_ENABLED:
            logger.warning("GCS is not available")
            return None
        
        try:
            bucket = bucket_name or GCS_BUCKET_NAME
            json_filename = f"{Path(filename).stem}_scan_result.json"
            gcs_path = f"{GCS_SCHEMA_FOLDER}/{json_filename}"
            
            result = upload_json_to_gcs(
                data=scan_result,
                destination_blob_name=gcs_path,
                bucket_name=bucket
            )
            
            if result:
                return {
                    "bucket": bucket,
                    "path": gcs_path,
                    "url": f"gs://{bucket}/{gcs_path}",
                    "uploaded_at": result.get("uploaded_at")
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to upload scan result to GCS: {e}")
            return None
    
    @staticmethod
    def get_config() -> Dict[str, Any]:
        """Get GCS configuration"""
        return {
            "enabled": GCS_ENABLED,
            "bucket_name": GCS_BUCKET_NAME,
            "folders": {
                "raw": GCS_RAW_FOLDER,
                "processed": GCS_PROCESSED_FOLDER,
                "schema": GCS_SCHEMA_FOLDER
            }
        }
