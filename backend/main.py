"""
Main FastAPI Application
Mapping Export API with Excel Scanner
"""
import logging
import uvicorn
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import create_tables, test_database_connection
from features import excel_scanner, mapping_rules

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up FastAPI application...")
    try:
        create_tables()
        connection_ok = await test_database_connection()
        if connection_ok:
            logger.info("Database connection validated successfully")
        else:
            logger.warning("Database connection test failed")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI application...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(excel_scanner.router)
app.include_router(mapping_rules.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
