# Data Mapper Application

A full-stack web application for managing Excel file mapping exports with intelligent scanning capabilities. Built with React + TypeScript on the frontend and FastAPI on the backend.

## Overview

The Data Mapper Application provides a comprehensive solution for:

- **Excel File Scanning**: Upload and analyze Excel files (.xlsx, .xls) to extract structure and preview data
- **Mapping Rules Management**: Create, update, and manage complex data mapping configurations
- **Cloud Storage Integration**: Automatic upload to Google Cloud Storage (GCS)
- **Batch Processing**: Handle multiple files simultaneously
- **Scan History**: Track and retrieve previous scan results

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Mapping    │  │   Exports    │  │  UI Components│      │
│  │    Page      │  │   Manager    │  │   (Lucide)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                 │                  │             │
│           └─────────────────┴──────────────────┘             │
│                           │                                  │
│                      Axios HTTP                              │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Excel Scanner│  │ Mapping Rules│  │  GCS Service │      │
│  │   Router     │  │   Router     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                 │                  │             │
│           └─────────────────┴──────────────────┘             │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              ▼                         ▼                     │
│      ┌──────────────┐         ┌──────────────┐              │
│      │  PostgreSQL  │         │     GCS      │              │
│      │   Database   │         │   Storage    │              │
│      └──────────────┘         └──────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **React** 19.1.1 - UI framework
- **TypeScript** 5.8.3 - Type safety
- **Vite** 7.1.0 - Build tool & dev server
- **TailwindCSS** 4.1.11 - Styling framework
- **React Router** 7.9.4 - Client-side routing
- **Axios** 1.12.2 - HTTP client
- **Lucide React** 0.539.0 - Icon library
- **Sonner** 2.0.7 - Toast notifications

### Backend
- **FastAPI** >=0.104.0 - Web framework
- **Uvicorn** >=0.24.0 - ASGI server
- **Python** >=3.10 - Runtime
- **Pydantic** >=2.5.0 - Data validation
- **SQLAlchemy** >=2.0.0 - ORM
- **PostgreSQL** - Database
- **Alembic** >=1.13.0 - Database migrations
- **Pandas** >=2.1.0 - Data processing
- **OpenPyXL** >=3.1.0 - Excel file handling
- **Google Cloud Storage** >=2.14.0 - Cloud storage

## Project Structure

```
data-mapper-application/
├── frontend/                    # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── features/           # Feature modules
│   │   │   ├── mapping/        # Mapping page feature
│   │   │   └── exports-manager/ # Exports management
│   │   ├── components/         # Shared UI components
│   │   ├── config/             # Configuration files
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility libraries
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Helper functions
│   └── package.json
│
├── backend/                     # FastAPI backend
│   ├── core/                   # Core configuration
│   │   ├── config.py           # App settings
│   │   └── database.py         # Database connection
│   ├── features/               # Feature modules
│   │   ├── excel_scanner/      # Excel scanning logic
│   │   └── mapping_rules/      # Mapping rules CRUD
│   ├── utils/                  # Utility functions
│   ├── main.py                 # Application entry point
│   ├── pyproject.toml          # Python dependencies
│   ├── Dockerfile              # Container configuration
│   └── docker-compose.yml      # Multi-container setup
│
└── README.md                    # This file
```

## Quick Start

### Prerequisites
- **Node.js** (v18+) and **pnpm** (or npm)
- **Python** 3.10+
- **PostgreSQL** database
- **Google Cloud Storage** account (optional)

### Frontend Setup

```bash
cd frontend
pnpm install
```

Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:8001
```

Run development server:
```bash
pnpm dev
```

Frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
GCS_BUCKET_NAME=your-bucket-name
ENABLE_GCS_BY_DEFAULT=True
APP_TITLE=Mapping Export API with Excel Scanner
APP_VERSION=2.1.0
ALLOWED_ORIGINS=["http://localhost:5173"]
MAX_FILE_SIZE_MB=100
MAX_FILES_PER_BATCH=5
MAX_SCAN_ROWS_DEFAULT=10
```

Run development server:
```bash
python main.py
```

Backend will be available at `http://localhost:8001`

API documentation: `http://localhost:8001/docs`

## Docker Deployment

### Using Docker Compose
```bash
cd backend
docker-compose up -d
```

This will start:
- FastAPI backend on port `8001`
- Ngrok tunnel on port `4040` (for external access)

### Manual Docker Build
```bash
cd backend
docker build -t data-mapper-api .
docker run -p 8001:8001 --env-file .env data-mapper-api
```

## Environment Variables

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API base URL | `http://localhost:8001` |

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket | ✅ |
| `ENABLE_GCS_BY_DEFAULT` | Auto-upload to GCS | ❌ |
| `ALLOWED_ORIGINS` | CORS allowed origins | ❌ |
| `MAX_FILE_SIZE_MB` | Max file upload size | ❌ |
| `MAX_FILES_PER_BATCH` | Max files per batch | ❌ |

## API Endpoints

### Excel Scanner
- `POST /api/excel/scan-upload` - Upload and scan single file
- `POST /api/excel/scan-upload-multiple` - Batch file upload
- `POST /api/excel/scan-upload-gcs` - Upload with GCS storage
- `GET /api/excel/scan-history` - Get scan history
- `GET /api/excel/scan-history/{scan_id}` - Get specific scan
- `DELETE /api/excel/scan-history/{scan_id}` - Delete scan result
- `GET /api/excel/stats` - Get scan statistics
- `GET /api/excel/gcs-config` - Get GCS configuration

### Mapping Rules
- `POST /api/mapping-exports` - Create mapping rule
- `GET /api/mapping-exports` - List all mappings
- `GET /api/mapping-exports/{mapping_id}` - Get specific mapping
- `PUT /api/mapping-exports/{mapping_id}` - Update mapping
- `DELETE /api/mapping-exports/{mapping_id}` - Delete mapping

## Development

### Frontend Scripts
```bash
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm lint       # Run ESLint
```

### Backend Testing
```bash
pytest                    # Run all tests
pytest tests/test_*.py   # Run specific test
```

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variable: `VITE_BACKEND_URL`
3. Deploy automatically on push

### Backend (Docker + Cloud)
1. Build Docker image
2. Push to container registry
3. Deploy to cloud platform (Railway, Render, GCP, AWS)
4. Configure environment variables
5. Set up PostgreSQL database
6. Configure GCS credentials

## Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [UV Setup Guide](./backend/UV_SETUP.md)

## License

This project is proprietary software. All rights reserved.

## Support

For issues or questions, please contact the development team or create an issue in the repository.
