"""
Mapping Rules API Router
"""
import logging
import json
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from .schemas import MappingRuleCreate, MappingRuleUpdate, MappingRuleResponse
from .service import MappingRulesService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/mapping-exports",
    tags=["Mapping Rules"]
)


@router.post("/debug-mappings")
async def debug_mappings(data: dict):
    """Debug endpoint to inspect incoming data structure"""
    try:
        logger.info(f"Raw data received: {json.dumps(data, indent=2, default=str)}")
        
        if 'mappings' in data:
            mappings = data['mappings']
            logger.info(f"Mappings type: {type(mappings)}")
            
            for key, value in mappings.items():
                logger.info(f"Key '{key}': type={type(value)}, value={value}")
                
                if key in ['guarantors', 'joints', 'assets']:
                    if isinstance(value, list):
                        for i, item in enumerate(value):
                            logger.info(f"  Item {i}: type={type(item)}, value={item}")
                            if isinstance(item, dict):
                                for sub_key, sub_value in item.items():
                                    logger.info(f"    SubKey '{sub_key}': type={type(sub_value)}, value={sub_value}")
        
        return {"status": "debug complete", "data": data}
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return {"error": str(e)}


@router.post("", response_model=MappingRuleResponse)
async def create_mapping_export(
    data: MappingRuleCreate,
    db: Session = Depends(get_db)
):
    """Create a new mapping export"""
    try:
        return MappingRulesService.create_mapping_rule(data, db)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid mappings data: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Create mapping export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create mapping: {str(e)}")


@router.get("", response_model=List[MappingRuleResponse])
async def get_mapping_exports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all mapping exports"""
    try:
        return MappingRulesService.get_all_mapping_rules(db, skip, limit)
    except Exception as e:
        logger.error(f"Get mapping exports error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch mappings: {str(e)}")


@router.get("/{mapping_id}", response_model=MappingRuleResponse)
async def get_mapping_export(
    mapping_id: str,
    db: Session = Depends(get_db)
):
    """Get specific mapping export by ID"""
    try:
        result = MappingRulesService.get_mapping_rule_by_id(db, mapping_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Mapping not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get mapping export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{mapping_id}", response_model=MappingRuleResponse)
async def update_mapping_export(
    mapping_id: str,
    data: MappingRuleUpdate,
    db: Session = Depends(get_db)
):
    """Update mapping export"""
    try:
        result = MappingRulesService.update_mapping_rule(db, mapping_id, data)
        
        if not result:
            raise HTTPException(status_code=404, detail="Mapping not found")
        
        return result
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid mappings data: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update mapping export error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update mapping: {str(e)}")


@router.delete("/{mapping_id}")
async def delete_mapping_export(
    mapping_id: str,
    db: Session = Depends(get_db)
):
    """Delete mapping export"""
    try:
        success = MappingRulesService.delete_mapping_rule(db, mapping_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Mapping not found")
        
        return {
            "success": True,
            "message": "Deleted mapping successfully!",
            "deleted_id": mapping_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete mapping export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
