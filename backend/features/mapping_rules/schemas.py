"""
Mapping Rules Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime


class MappingSource(BaseModel):
    """Schema for mapping source (file, sheet, column)"""
    file: str
    sheet: str
    column: str


class MappingRuleCreate(BaseModel):
    """Schema for creating a new mapping rule"""
    name: str = Field(..., min_length=1, description="Name of the mapping export")
    mappings: Dict[str, Any] = Field(..., description="Mapping data in new format")


class MappingRuleUpdate(BaseModel):
    """Schema for updating an existing mapping rule"""
    name: Optional[str] = Field(None, min_length=1)
    mappings: Optional[Dict[str, Any]] = None


class MappingRuleResponse(BaseModel):
    """Schema for mapping rule response"""
    id: str
    name: str
    mappings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
