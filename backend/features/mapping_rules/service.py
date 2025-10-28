"""
Mapping Rules Business Logic
"""
import logging
import json
from typing import List, Optional
from sqlalchemy.orm import Session

from .models import MappingRuleDB
from .schemas import MappingRuleResponse, MappingRuleCreate, MappingRuleUpdate
from .validators import MappingValidator

logger = logging.getLogger(__name__)


class MappingRulesService:
    """Service layer for mapping rules operations"""
    
    @staticmethod
    def create_mapping_rule(
        data: MappingRuleCreate,
        db: Session
    ) -> MappingRuleResponse:
        """Create a new mapping rule"""
        if not data.name.strip():
            raise ValueError("Mapping name is required")
        
        logger.info(f"Creating mapping rule: {data.name}")
        
        # Validate mappings data
        validated_mappings = MappingValidator.validate_mappings_data(data.mappings)
        
        if not validated_mappings:
            raise ValueError("At least one mapping is required")
        
        # Create database record
        db_mapping = MappingRuleDB(
            name=data.name.strip(),
            mappings=json.dumps(validated_mappings)
        )
        
        db.add(db_mapping)
        db.commit()
        db.refresh(db_mapping)
        
        logger.info(f"Successfully created mapping rule: {data.name}")
        
        mappings_data = json.loads(db_mapping.mappings)
        
        return MappingRuleResponse(
            id=str(db_mapping.id),
            name=db_mapping.name,
            mappings=mappings_data,
            created_at=db_mapping.created_at,
            updated_at=db_mapping.updated_at
        )
    
    @staticmethod
    def get_all_mapping_rules(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[MappingRuleResponse]:
        """Get all mapping rules"""
        mappings = db.query(MappingRuleDB)\
                    .order_by(MappingRuleDB.created_at.desc())\
                    .offset(skip)\
                    .limit(limit)\
                    .all()
        
        results = []
        for mapping in mappings:
            try:
                mappings_data = json.loads(mapping.mappings)
                
                results.append(MappingRuleResponse(
                    id=str(mapping.id),
                    name=mapping.name,
                    mappings=mappings_data,
                    created_at=mapping.created_at,
                    updated_at=mapping.updated_at
                ))
            except (json.JSONDecodeError, ValueError) as parse_error:
                logger.warning(f"Failed to parse record {mapping.id}: {parse_error}")
                results.append(MappingRuleResponse(
                    id=str(mapping.id),
                    name=mapping.name,
                    mappings={},
                    created_at=mapping.created_at,
                    updated_at=mapping.updated_at
                ))
        
        return results
    
    @staticmethod
    def get_mapping_rule_by_id(
        db: Session,
        mapping_id: str
    ) -> Optional[MappingRuleResponse]:
        """Get mapping rule by ID"""
        mapping = db.query(MappingRuleDB).filter(MappingRuleDB.id == mapping_id).first()
        
        if not mapping:
            return None
        
        try:
            mappings_data = json.loads(mapping.mappings)
            
            return MappingRuleResponse(
                id=str(mapping.id),
                name=mapping.name,
                mappings=mappings_data,
                created_at=mapping.created_at,
                updated_at=mapping.updated_at
            )
        except (json.JSONDecodeError, ValueError) as parse_error:
            logger.warning(f"Failed to parse mapping {mapping.id}: {parse_error}")
            return None
    
    @staticmethod
    def update_mapping_rule(
        db: Session,
        mapping_id: str,
        data: MappingRuleUpdate
    ) -> Optional[MappingRuleResponse]:
        """Update mapping rule"""
        mapping = db.query(MappingRuleDB).filter(MappingRuleDB.id == mapping_id).first()
        
        if not mapping:
            return None
        
        # Update name if provided
        if data.name is not None:
            if not data.name.strip():
                raise ValueError("Mapping name cannot be empty")
            mapping.name = data.name.strip()
        
        # Update mappings if provided
        if data.mappings is not None:
            validated_mappings = MappingValidator.validate_mappings_data(data.mappings)
            mapping.mappings = json.dumps(validated_mappings)
        
        db.commit()
        db.refresh(mapping)
        
        logger.info(f"Successfully updated mapping rule: {mapping_id}")
        
        mappings_data = json.loads(mapping.mappings)
        
        return MappingRuleResponse(
            id=str(mapping.id),
            name=mapping.name,
            mappings=mappings_data,
            created_at=mapping.created_at,
            updated_at=mapping.updated_at
        )
    
    @staticmethod
    def delete_mapping_rule(
        db: Session,
        mapping_id: str
    ) -> bool:
        """Delete mapping rule"""
        mapping = db.query(MappingRuleDB).filter(MappingRuleDB.id == mapping_id).first()
        
        if not mapping:
            return False
        
        db.delete(mapping)
        db.commit()
        
        logger.info(f"Successfully deleted mapping rule: {mapping_id}")
        return True
