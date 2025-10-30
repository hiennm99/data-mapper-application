"""
Excel Scanner API Router
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from .schemas import ExcelScanResponse
from .service import ExcelScannerService
from utils.excel_scanner import (
    scan_uploaded_file_with_gcs,
    scan_uploaded_file
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/excel",
    tags=["Excel Scanner"]
)


@router.post("/scan-upload")
async def scan_uploaded_excel_file(
    file: UploadFile = File(...),
    max_scan_rows: int = Form(settings.MAX_SCAN_ROWS_DEFAULT),
    save_to_db: bool = Form(True),
    db: Session = Depends(get_db)
):
    """Upload and scan Excel file"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="Only Excel files (.xlsx, .xls) are supported"
            )
        
        # Read file content
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        if file_size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file_size_mb:.2f} MB. Maximum allowed: {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        logger.info(f"Scanning uploaded file: {file.filename} ({file_size_mb:.2f}MB)")
        
        # Scan file
        scan_result = scan_uploaded_file(
            file_content=file_content,
            filename=file.filename,
            max_scan_rows=max_scan_rows
        )
        
        # Save to database if requested
        saved_record = None
        if save_to_db:
            saved_record = ExcelScannerService.save_scan_result(
                scan_result, file.filename, file_size_mb, db
            )
        
        return ExcelScannerService.create_response(
            scan_result, file.filename, file_size_mb, max_scan_rows, save_to_db, saved_record
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Excel scan upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan Excel file: {str(e)}")


@router.post("/scan-upload-gcs")
async def scan_uploaded_excel_file_with_gcs_endpoint(
    file: UploadFile = File(...),
    max_scan_rows: int = Form(settings.MAX_SCAN_ROWS_DEFAULT),
    save_to_db: bool = Form(True),
    save_to_gcs: bool = Form(settings.ENABLE_GCS_BY_DEFAULT),
    gcs_bucket_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload and scan Excel file with GCS storage"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="Only Excel files (.xlsx, .xls) are supported"
            )
        
        # Read file content
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        if file_size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file_size_mb:.2f}MB. Maximum allowed: {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        logger.info(f"Scanning uploaded file with GCS: {file.filename} ({file_size_mb:.2f}MB)")
        
        # Scan file with GCS integration - this will save processed files to GCS_PROCESSED_FOLDER
        scan_result = scan_uploaded_file_with_gcs(
            file_content=file_content,
            filename=file.filename,
            max_scan_rows=max_scan_rows,
            save_to_gcs=save_to_gcs,
            gcs_bucket_name=gcs_bucket_name or settings.GCS_BUCKET_NAME
        )
        
        # Extract GCS info from scan result
        gcs_info = scan_result.get("gcs_storage") if save_to_gcs else None
        
        # Save to database if requested
        saved_record = None
        if save_to_db:
            saved_record = ExcelScannerService.save_scan_result(
                scan_result, file.filename, file_size_mb, db
            )
        
        return ExcelScannerService.create_response(
            scan_result, file.filename, file_size_mb, max_scan_rows, 
            save_to_db, saved_record, gcs_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Excel scan upload with GCS error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan Excel file: {str(e)}")


@router.get("/gcs-config")
async def get_gcs_config():
    """Get current GCS configuration"""
    from .gcs_utils import GCSService
    
    gcs_config = GCSService.get_config()
    
    return {
        "gcs_enabled": gcs_config["enabled"],
        "gcs_bucket_name": gcs_config["bucket_name"],
        "gcs_enabled_by_default": settings.ENABLE_GCS_BY_DEFAULT,
        "folders": gcs_config["folders"]
    }


@router.get("/batch-upload-limits")
async def get_batch_upload_limits():
    """Get batch upload limits information"""
    return {
        "max_files_per_batch": settings.MAX_FILES_PER_BATCH,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "max_total_size_mb": settings.MAX_TOTAL_SIZE_MB,
        "supported_formats": [".xlsx", ".xls"],
        "max_scan_rows_default": settings.MAX_SCAN_ROWS_DEFAULT,
        "max_scan_rows_limit": settings.MAX_SCAN_ROWS_LIMIT
    }


@router.get("/scan-history", response_model=List[ExcelScanResponse])
async def get_excel_scan_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get Excel scan history"""
    try:
        return ExcelScannerService.get_scan_history(db, skip, limit)
    except Exception as e:
        logger.error(f"Get excel scan history error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch scan history: {str(e)}")


@router.get("/scan-history/{scan_id}", response_model=ExcelScanResponse)
async def get_excel_scan_result(
    scan_id: str,
    db: Session = Depends(get_db)
):
    """Get specific Excel scan result by ID"""
    try:
        result = ExcelScannerService.get_scan_by_id(db, scan_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Scan result not found")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get excel scan result error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/scan-history/{scan_id}")
async def delete_excel_scan_result(
    scan_id: str,
    db: Session = Depends(get_db)
):
    """Delete Excel scan result by ID"""
    try:
        success = ExcelScannerService.delete_scan_result(db, scan_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Scan result not found")
        
        return {
            "success": True,
            "message": "Deleted scan result successfully!",
            "deleted_id": scan_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete scan result error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan-upload-multiple")
async def scan_uploaded_excel_files_multiple(
    files: List[UploadFile] = File(...),
    max_scan_rows: int = Form(settings.MAX_SCAN_ROWS_DEFAULT),
    save_to_db: bool = Form(True),
    save_to_gcs: bool = Form(settings.ENABLE_GCS_BY_DEFAULT),
    db: Session = Depends(get_db)
):
    """Upload and scan multiple Excel files"""
    try:
        results = []
        
        for file in files:
            # Validate file type
            if not file.filename.lower().endswith(('.xlsx', '.xls')):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": "Only Excel files (.xlsx, .xls) are supported"
                })
                continue
            
            # Read file content
            file_content = await file.read()
            file_size_mb = len(file_content) / (1024 * 1024)
            
            if file_size_mb > settings.MAX_FILE_SIZE_MB:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"File too large: {file_size_mb:.2f} MB. Maximum allowed: {settings.MAX_FILE_SIZE_MB}MB"
                })
                continue
            
            try:
                # Scan file with GCS integration - this will save processed files to GCS_PROCESSED_FOLDER
                scan_result = scan_uploaded_file_with_gcs(
                    file_content=file_content,
                    filename=file.filename,
                    max_scan_rows=max_scan_rows,
                    save_to_gcs=save_to_gcs,
                    gcs_bucket_name=settings.GCS_BUCKET_NAME
                )
                
                # Save to database
                saved_record = None
                if save_to_db:
                    saved_record = ExcelScannerService.save_scan_result(
                        db=db,
                        filename=file.filename,
                        scan_result=scan_result,
                        file_size_mb=file_size_mb
                    )
                
                # Extract GCS info from scan result
                gcs_info = scan_result.get("gcs_storage") if save_to_gcs else None
                
                # Create response
                response = ExcelScannerService.create_response(
                    scan_result=scan_result,
                    filename=file.filename,
                    file_size_mb=file_size_mb,
                    max_scan_rows=max_scan_rows,
                    save_to_db=save_to_db,
                    saved_record=saved_record,
                    gcs_info=gcs_info
                )
                response["success"] = True
                results.append(response)
                
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {e}")
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "total_files": len(files),
            "processed_files": len([r for r in results if r.get("success", False)]),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Scan multiple files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_excel_scan_stats(db: Session = Depends(get_db)):
    """Get Excel scan statistics"""
    try:
        return ExcelScannerService.get_stats(db)
    except Exception as e:
        logger.error(f"Get excel scan stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
