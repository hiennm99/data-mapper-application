# Data Mapper Backend

High-performance FastAPI backend for Excel file scanning, data mapping management, and Google Cloud Storage integration.

## Overview

The backend provides robust APIs for:

- **Excel File Scanning**: Parse and analyze Excel files (.xlsx, .xls) with configurable row limits
- **Mapping Rules Management**: CRUD operations for data mapping configurations
- **Google Cloud Storage**: Automatic file upload and storage management
- **Batch Processing**: Handle multiple file uploads simultaneously
- **Database Persistence**: Store scan results and mapping rules in PostgreSQL
- **RESTful API**: Well-documented endpoints with automatic OpenAPI docs

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | >=0.104.0 | Modern async web framework |
| **Uvicorn** | >=0.24.0 | ASGI server with high performance |
| **Python** | >=3.10 | Programming language |
| **Pydantic** | >=2.5.0 | Data validation and settings |
| **SQLAlchemy** | >=2.0.0 | SQL toolkit and ORM |
| **PostgreSQL** | - | Relational database |
| **Alembic** | >=1.13.0 | Database migration tool |
| **Pandas** | >=2.1.0 | Data manipulation and analysis |
| **OpenPyXL** | >=3.1.0 | Read/write Excel 2010 files (.xlsx) |
| **xlrd** | >=2.0.0 | Read Excel files (.xls) |
| **Google Cloud Storage** | >=2.14.0 | Cloud file storage |
| **python-multipart** | >=0.0.6 | File upload support |
| **python-dotenv** | >=1.0.0 | Environment variable management |

## Project Structure

```
backend/
├── core/                           # Core application modules
│   ├── __init__.py
│   ├── config.py                   # Configuration management
│   └── database.py                 # Database connection & session
│
├── features/                       # Feature-based modules
│   ├── __init__.py
│   ├── excel_scanner/              # Excel scanning feature
│   │   ├── __init__.py
│   │   ├── router.py               # API endpoints
│   │   ├── service.py              # Business logic
│   │   ├── schemas.py              # Pydantic models
│   │   ├── models.py               # SQLAlchemy models
│   │   └── gcs_utils.py            # GCS integration
│   │
│   └── mapping_rules/              # Mapping rules feature
│       ├── __init__.py
│       ├── router.py               # API endpoints
│       ├── service.py              # Business logic
│       ├── schemas.py              # Pydantic models
│       └── models.py               # SQLAlchemy models
│
├── utils/                          # Utility functions
│   ├── __init__.py
│   ├── excel_scanner.py            # Excel parsing utilities
│   └── gcs_storage.py              # GCS storage utilities
│
├── logs/                           # Application logs
│
├── main.py                         # Application entry point
├── pyproject.toml                  # Python dependencies (uv)
├── requirements.txt                # Python dependencies (pip)
├── uv.lock                         # Dependency lock file
├── Dockerfile                      # Container configuration
├── docker-compose.yml              # Multi-container setup
└── UV_SETUP.md                     # UV package manager guide
```

## Installation & Setup

### Prerequisites
- **Python** 3.10 or higher
- **PostgreSQL** database
- **Google Cloud Storage** account (optional)
- **uv** package manager (recommended) or pip

### 1. Clone Repository
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies

**Using uv (recommended)**:
```bash
pip install uv
uv sync
```

**Using pip**:
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Google Cloud Storage Configuration
GCS_BUCKET_NAME=your-bucket-name
ENABLE_GCS_BY_DEFAULT=True

# Application Configuration
APP_TITLE=Mapping Export API with Excel Scanner
APP_VERSION=2.1.0
APP_DESCRIPTION=API for managing mapping exports and Excel file scanning

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:5173", "https://your-frontend.vercel.app"]

# File Upload Limits
MAX_FILE_SIZE_MB=100
MAX_FILES_PER_BATCH=5
MAX_TOTAL_SIZE_MB=200
MAX_SCAN_ROWS_DEFAULT=10
MAX_SCAN_ROWS_LIMIT=20
```

### 5. Set Up Google Cloud Storage (Optional)
If using GCS integration:

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 6. Initialize Database
```bash
# Create tables
python -c "from core.database import create_tables; create_tables()"

# Or use Alembic for migrations
alembic upgrade head
```

### 7. Run Development Server
```bash
python main.py
```

Server will start at `http://localhost:8001`

API Documentation: `http://localhost:8001/docs`

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket name | ✅ | - |
| `ENABLE_GCS_BY_DEFAULT` | Auto-upload files to GCS | ❌ | `True` |
| `APP_TITLE` | API title | ❌ | `Mapping Export API with Excel Scanner` |
| `APP_VERSION` | API version | ❌ | `2.1.0` |
| `APP_DESCRIPTION` | API description | ❌ | Auto-generated |
| `ALLOWED_ORIGINS` | CORS allowed origins (JSON array) | ❌ | `["*"]` |
| `MAX_FILE_SIZE_MB` | Maximum file size in MB | ❌ | `100` |
| `MAX_FILES_PER_BATCH` | Maximum files per batch upload | ❌ | `5` |
| `MAX_TOTAL_SIZE_MB` | Maximum total batch size in MB | ❌ | `200` |
| `MAX_SCAN_ROWS_DEFAULT` | Default rows to scan | ❌ | `10` |
| `MAX_SCAN_ROWS_LIMIT` | Maximum rows to scan | ❌ | `20` |

## API Endpoints

### Excel Scanner

#### Upload & Scan Single File
```http
POST /api/excel/scan-upload
Content-Type: multipart/form-data

file: <Excel file>
max_scan_rows: 10 (optional)
save_to_db: true (optional)
```

#### Upload & Scan with GCS
```http
POST /api/excel/scan-upload-gcs
Content-Type: multipart/form-data

file: <Excel file>
max_scan_rows: 10 (optional)
save_to_db: true (optional)
save_to_gcs: true (optional)
gcs_bucket_name: bucket-name (optional)
```

#### Batch Upload Multiple Files
```http
POST /api/excel/scan-upload-multiple
Content-Type: multipart/form-data

files: <Excel files[]>
max_scan_rows: 10 (optional)
save_to_db: true (optional)
save_to_gcs: true (optional)
```

#### Get Scan History
```http
GET /api/excel/scan-history?skip=0&limit=50
```

#### Get Specific Scan Result
```http
GET /api/excel/scan-history/{scan_id}
```

#### Delete Scan Result
```http
DELETE /api/excel/scan-history/{scan_id}
```

#### Get Scan Statistics
```http
GET /api/excel/stats
```

#### Get GCS Configuration
```http
GET /api/excel/gcs-config
```

#### Get Batch Upload Limits
```http
GET /api/excel/batch-upload-limits
```

### Mapping Rules

#### Create Mapping Rule
```http
POST /api/mapping-exports
Content-Type: application/json

{
  "name": "Customer Mapping",
  "description": "Map customer data",
  "mappings": { ... }
}
```

#### Get All Mapping Rules
```http
GET /api/mapping-exports?skip=0&limit=100
```

#### Get Specific Mapping Rule
```http
GET /api/mapping-exports/{mapping_id}
```

#### Update Mapping Rule
```http
PUT /api/mapping-exports/{mapping_id}
Content-Type: application/json

{
  "name": "Updated Mapping",
  "mappings": { ... }
}
```

#### Delete Mapping Rule
```http
DELETE /api/mapping-exports/{mapping_id}
```

#### Debug Mappings (Development)
```http
POST /api/mapping-exports/debug-mappings
Content-Type: application/json

{ "mappings": { ... } }
```

## Development

### Adding New Endpoints

1. **Create Feature Module**:
```bash
mkdir features/new_feature
touch features/new_feature/__init__.py
touch features/new_feature/router.py
touch features/new_feature/service.py
touch features/new_feature/schemas.py
touch features/new_feature/models.py
```

2. **Define Router** (`router.py`):
```python
from fastapi import APIRouter

router = APIRouter(
    prefix="/api/new-feature",
    tags=["New Feature"]
)

@router.get("/")
async def get_items():
    return {"items": []}
```

3. **Register Router** (`main.py`):
```python
from features.new_feature import router as new_feature_router

app.include_router(new_feature_router)
```

### Adding Database Models

1. **Define Model** (`models.py`):
```python
from sqlalchemy import Column, String, Integer
from core.database import Base

class NewModel(Base):
    __tablename__ = "new_table"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
```

2. **Create Migration**:
```bash
alembic revision --autogenerate -m "Add new_table"
alembic upgrade head
```

### Code Style
The project follows:
- **Black**: Line length 120, Python 3.10+
- **isort**: Import sorting with Black profile
- **mypy**: Type checking (optional)

Format code:
```bash
black .
isort .
```

## Testing

### Run Tests
```bash
# Install dev dependencies
uv sync --extra dev

# Run all tests
pytest

# Run specific test file
pytest tests/test_excel_scanner.py

# Run with coverage
pytest --cov=. --cov-report=html
```

### Test Structure
```
tests/
├── __init__.py
├── test_excel_scanner.py
├── test_mapping_rules.py
└── conftest.py  # Fixtures
```

### Example Test
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_scan_upload():
    with open("test_file.xlsx", "rb") as f:
        response = client.post(
            "/api/excel/scan-upload",
            files={"file": ("test.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
    
    assert response.status_code == 200
    assert "sheets" in response.json()
```

## Deployment

### Docker Deployment

#### Build Image
```bash
docker build -t data-mapper-api .
```

#### Run Container
```bash
docker run -d \
  -p 8001:8001 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  data-mapper-api
```

#### Docker Compose
```bash
docker-compose up -d
```

This starts:
- **API**: Port 8001
- **Ngrok Tunnel**: Port 4040 (for external access)

### Cloud Deployment

#### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

#### Render
1. Create new Web Service
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python main.py`
4. Add environment variables

#### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/data-mapper-api
gcloud run deploy data-mapper-api \
  --image gcr.io/PROJECT_ID/data-mapper-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Production Checklist
- [ ] Set `ALLOWED_ORIGINS` to specific domains
- [ ] Use strong database credentials
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up health check endpoints
- [ ] Use environment-specific `.env` files
- [ ] Enable rate limiting
- [ ] Set up error tracking (Sentry)

## Uvicorn Configuration

### Development
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### With Gunicorn
```bash
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001
```

## Monitoring & Logging

### Logs
Application logs are stored in `logs/` directory:
- `logs/app.log` - Application logs
- `logs/error.log` - Error logs

### Health Check
```http
GET /
```

Returns API metadata and health status.

## License

This project is proprietary software. All rights reserved.

## Support

For issues or questions, contact the development team or create an issue in the repository.
