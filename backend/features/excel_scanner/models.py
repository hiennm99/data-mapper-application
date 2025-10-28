"""
Excel Scanner Database Models
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from core.database import Base


class ExcelScanResultDB(Base):
    """Database model for Excel scan results"""
    __tablename__ = "scan_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    filename = Column(String, nullable=False, index=True)
    scan_results = Column(Text, nullable=False)  # JSON string of scan results
    file_size = Column(String, nullable=True)
    gcs_info = Column(Text, nullable=True)  # JSON string of GCS storage info
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
