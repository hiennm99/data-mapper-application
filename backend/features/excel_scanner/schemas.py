"""
Excel Scanner Pydantic Schemas
"""
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class ExcelScanResponse(BaseModel):
    """Schema for Excel scan result response"""
    id: str
    filename: str
    file_size: str
    scan_results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
