"""
Mapping Rules Database Models
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from core.database import Base


class MappingRuleDB(Base):
    """Database model for mapping rules"""
    __tablename__ = "mapping_rules"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, index=True)
    mappings = Column(Text, nullable=False)  # JSON string for mapping data
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
