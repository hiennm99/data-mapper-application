"""
Application Configuration
Centralized configuration management using environment variables
"""
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables"""
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Google Cloud Storage Configuration
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME")
    ENABLE_GCS_BY_DEFAULT: bool = os.getenv("ENABLE_GCS_BY_DEFAULT", "True").lower() == "true"
    
    # Application Configuration
    APP_TITLE: str = os.getenv("APP_TITLE", "Mapping Export API with Excel Scanner")
    APP_VERSION: str = os.getenv("APP_VERSION", "2.1.0")
    APP_DESCRIPTION: str = os.getenv("APP_DESCRIPTION", "API for managing mapping exports and Excel file scanning")
    
    # CORS Configuration
    @classmethod
    def _parse_allowed_origins(cls):
        """Parse ALLOWED_ORIGINS from environment variable"""
        origins_str = os.getenv("ALLOWED_ORIGINS", "*")
        try:
            # Try to parse as JSON array first
            if origins_str.startswith("["):
                return json.loads(origins_str)
            # Otherwise parse as comma-separated string
            else:
                return [origin.strip() for origin in origins_str.split(",")]
        except json.JSONDecodeError:
            return [origins_str.strip()]
    
    ALLOWED_ORIGINS: list = _parse_allowed_origins.__func__(None)
    
    # File Upload Limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
    MAX_FILES_PER_BATCH: int = int(os.getenv("MAX_FILES_PER_BATCH", "5"))
    MAX_TOTAL_SIZE_MB: int = int(os.getenv("MAX_TOTAL_SIZE_MB", "200"))
    MAX_SCAN_ROWS_DEFAULT: int = int(os.getenv("MAX_SCAN_ROWS_DEFAULT", "20"))
    MAX_SCAN_ROWS_LIMIT: int = int(os.getenv("MAX_SCAN_ROWS_LIMIT", "100"))
    
    # Validation
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is not set")
        if not cls.GCS_BUCKET_NAME:
            raise ValueError("GCS_BUCKET_NAME environment variable is not set")


# Create settings instance
settings = Settings()

# Validate settings on import
settings.validate()
