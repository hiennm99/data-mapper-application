"""
Excel Scanner Business Logic
"""
import logging
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from .models import ExcelScanResultDB
from .schemas import ExcelScanResponse
from .gcs_utils import GCSService

logger = logging.getLogger(__name__)


class ExcelScannerService:
    """Service layer for Excel scanning operations"""
    
    @staticmethod
    def save_scan_result(
        scan_result: Dict[str, Any],
        filename: str,
        file_size_mb: float,
        db: Session
    ) -> Optional[Dict]:
        """Save scan result to database"""
        try:
            db_scan_result = ExcelScanResultDB(
                filename=filename,
                scan_results=json.dumps(scan_result),
                file_size=f"{file_size_mb:.2f}MB",
                gcs_info=json.dumps(scan_result.get("gcs_storage")) if scan_result.get("gcs_storage") else None
            )
            
            db.add(db_scan_result)
            db.commit()
            db.refresh(db_scan_result)
            
            saved_record = {
                "id": str(db_scan_result.id),
                "saved_at": db_scan_result.created_at.isoformat()
            }
            
            logger.info(f"Scan result saved to database with ID: {db_scan_result.id}")
            return saved_record
            
        except Exception as db_error:
            logger.warning(f"Failed to save scan result to database: {db_error}")
            db.rollback()
            return None
    
    @staticmethod
    def upload_to_gcs(
        file_content: bytes,
        filename: str,
        scan_result: Optional[Dict[str, Any]] = None,
        bucket_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload file and scan result to GCS
        
        Returns:
            Dict with GCS upload info
        """
        gcs_info = {
            "file_uploaded": False,
            "scan_result_uploaded": False,
            "file_gcs_info": None,
            "scan_result_gcs_info": None
        }
        
        if not GCSService.is_available():
            logger.warning("GCS is not available, skipping upload")
            return gcs_info
        
        # Upload raw file
        file_gcs_result = GCSService.upload_excel_file(
            file_content=file_content,
            filename=filename,
            bucket_name=bucket_name
        )
        
        if file_gcs_result:
            gcs_info["file_uploaded"] = True
            gcs_info["file_gcs_info"] = file_gcs_result
            logger.info(f"Uploaded file to GCS: {file_gcs_result['url']}")
        
        # Upload scan result if provided
        if scan_result:
            scan_gcs_result = GCSService.upload_scan_result(
                scan_result=scan_result,
                filename=filename,
                bucket_name=bucket_name
            )
            
            if scan_gcs_result:
                gcs_info["scan_result_uploaded"] = True
                gcs_info["scan_result_gcs_info"] = scan_gcs_result
                logger.info(f"Uploaded scan result to GCS: {scan_gcs_result['url']}")
        
        return gcs_info
    
    @staticmethod
    def create_response(
        scan_result: Dict[str, Any],
        filename: str,
        file_size_mb: float,
        max_scan_rows: int,
        save_to_db: bool,
        saved_record: Optional[Dict],
        gcs_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create unified response format"""
        response = {
            "success": True,
            "message": f"Successfully scanned {filename}",
            "scan_result": scan_result,
            "saved_record": saved_record,
            "processing_info": {
                "file_size": f"{file_size_mb:.2f}MB",
                "max_scan_rows": max_scan_rows,
                "saved_to_db": save_to_db and saved_record is not None
            }
        }
        
        if gcs_info:
            response["gcs_info"] = gcs_info
        
        return response
    
    @staticmethod
    def simplify_scan_result(full_scan_result: Dict[str, Any]) -> Dict[str, Any]:
        """Simplify scan result by removing complex GCS info"""
        simplified_scan_result = {
            "filename": full_scan_result["filename"],
            "file_size": full_scan_result["file_size"],
            "scan_timestamp": full_scan_result["scan_timestamp"],
            "sheets": [],
            "total_sheets": full_scan_result["total_sheets"],
            "sheets_with_header": full_scan_result["sheets_with_header"],
            "gcs_storage": None
        }
        
        # Simplify sheets data
        for sheet in full_scan_result["sheets"]:
            simplified_sheet = {
                "sheet_name": sheet["sheet_name"],
                "have_header": sheet["have_header"],
                "header_row_idx": sheet["header_row_idx"],
                "header_at_row": sheet["header_at_row"],
                "columns": sheet["columns"],
                "sample_data": sheet["sample_data"],
                "header_quality": sheet["header_quality"],
                "processed_file_info": None
            }
            simplified_scan_result["sheets"].append(simplified_sheet)
        
        return simplified_scan_result
    
    @staticmethod
    def get_scan_history(
        db: Session,
        skip: int = 0,
        limit: int = 50
    ) -> List[ExcelScanResponse]:
        """Get Excel scan history"""
        scan_results = db.query(ExcelScanResultDB)\
                        .order_by(ExcelScanResultDB.created_at.desc())\
                        .offset(skip)\
                        .limit(limit)\
                        .all()
        
        results = []
        for scan_result in scan_results:
            try:
                scan_data = json.loads(scan_result.scan_results)
                
                results.append(ExcelScanResponse(
                    id=str(scan_result.id),
                    filename=scan_result.filename,
                    file_size=scan_result.file_size or "Unknown",
                    scan_results=scan_data,
                    created_at=scan_result.created_at
                ))
            except (json.JSONDecodeError, ValueError) as parse_error:
                logger.warning(f"Failed to parse scan result {scan_result.id}: {parse_error}")
        
        return results
    
    @staticmethod
    def get_scan_by_id(db: Session, scan_id: str) -> Optional[ExcelScanResponse]:
        """Get specific scan result by ID"""
        try:
            uuid_obj = uuid.UUID(scan_id)
        except ValueError:
            return None
        
        scan_result = db.query(ExcelScanResultDB).filter(ExcelScanResultDB.id == uuid_obj).first()
        
        if not scan_result:
            return None
        
        try:
            scan_data = json.loads(scan_result.scan_results)
            
            return ExcelScanResponse(
                id=str(scan_result.id),
                filename=scan_result.filename,
                file_size=scan_result.file_size or "Unknown",
                scan_results=scan_data,
                created_at=scan_result.created_at
            )
        except (json.JSONDecodeError, ValueError) as parse_error:
            logger.warning(f"Failed to parse scan result {scan_result.id}: {parse_error}")
            return None
    
    @staticmethod
    def delete_scan_result(db: Session, scan_id: str) -> bool:
        """Delete scan result by ID"""
        scan_result = db.query(ExcelScanResultDB).filter(ExcelScanResultDB.id == scan_id).first()
        
        if not scan_result:
            return False
        
        db.delete(scan_result)
        db.commit()
        
        logger.info(f"Successfully deleted scan result: {scan_id}")
        return True
    
    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        """Get Excel scan statistics"""
        total_scans = db.query(ExcelScanResultDB).count()
        
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_scans = db.query(ExcelScanResultDB)\
                        .filter(ExcelScanResultDB.created_at >= week_ago)\
                        .count()
        
        return {
            "total_scans": total_scans,
            "recent_scans_7_days": recent_scans,
            "timestamp": datetime.now().isoformat()
        }
