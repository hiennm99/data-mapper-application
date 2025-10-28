"""
Mapping Rules Validation Logic
"""
from typing import List, Dict, Any
from .schemas import MappingSource


class MappingValidator:
    """Validator for mapping data"""
    
    @staticmethod
    def validate_mapping_source(data: Any) -> Dict[str, str]:
        """Validate and convert mapping source data"""
        if isinstance(data, dict):
            required_fields = ['file', 'sheet', 'column']
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
                if not isinstance(data[field], str) or not data[field].strip():
                    raise ValueError(f"Field {field} must be a non-empty string")
            
            extra_fields = set(data.keys()) - set(required_fields)
            if extra_fields:
                raise ValueError(f"Unexpected fields in mapping source: {extra_fields}")
            
            return data
        else:
            raise ValueError(f"Mapping source must be an object, got {type(data).__name__}")
    
    @staticmethod
    def validate_array_mappings(data: List[Any], array_type: str) -> List[Dict[str, Dict[str, str]]]:
        """Validate guarantors, joints, or assets array"""
        if not isinstance(data, list):
            raise ValueError(f"{array_type} must be an array, got {type(data).__name__}")
        
        result = []
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(f"{array_type} item {i} must be an object, got {type(item).__name__}")
            
            validated_item = {}
            for key, value in item.items():
                try:
                    validated_item[key] = MappingValidator.validate_mapping_source(value)
                except ValueError as e:
                    raise ValueError(f"{array_type} item {i}, field '{key}': {e}")
            
            if not validated_item:
                raise ValueError(f"{array_type} item {i} cannot be empty")
            
            result.append(validated_item)
        
        return result
    
    @staticmethod
    def validate_object_mappings(data: Any, field_name: str) -> Dict[str, MappingSource]:
        """Validate object mappings (like base group)"""
        if not isinstance(data, dict):
            raise ValueError(f"'{field_name}' must be an object, got {type(data).__name__}")
        
        result = {}
        for key, value in data.items():
            try:
                result[key] = MappingValidator.validate_mapping_source(value)
            except ValueError as e:
                raise ValueError(f"'{field_name}.{key}': {e}")
        
        return result
    
    @staticmethod
    def validate_mappings_data(data: Any) -> Dict[str, Any]:
        """Validate the entire mappings object"""
        if not isinstance(data, dict):
            raise ValueError(f"Mappings must be an object, got {type(data).__name__}")
        
        result = {}
        
        for key, value in data.items():
            try:
                # Array groups (multiple instances)
                if key in ['addresses', 'contacts', 'banks', 'guarantors', 'joints', 'assets', 'jobs', 'finance']:
                    result[key] = MappingValidator.validate_array_mappings(value, key)
                # Base group (single object with multiple fields)
                elif key == 'base':
                    result[key] = MappingValidator.validate_object_mappings(value, key)
                # Unknown key - try to validate as mapping source
                else:
                    result[key] = MappingValidator.validate_mapping_source(value)
            except ValueError as e:
                raise ValueError(f"Field '{key}': {e}")
        
        return result
