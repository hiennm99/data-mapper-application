# Mapping Export API with Excel Scanner

API backend cho hệ thống quản lý mapping rules và quét file Excel.

## 📁 Cấu trúc dự án (Project Structure)

```
fastapi/
├── main.py                      # Entry point của ứng dụng
├── config.py                    # Quản lý cấu hình từ environment variables
├── database.py                  # Database setup và session management
├── models.py                    # SQLAlchemy database models
├── schemas.py                   # Pydantic schemas cho validation
├── routers/                     # API endpoints
│   ├── __init__.py
│   ├── excel_scanner.py        # Excel scanning endpoints
│   └── mapping_rules.py        # Mapping rules CRUD endpoints
├── excel_scanner_updated.py    # Excel scanning utilities
├── excel_scanner_utils.py      # Excel scanning helper functions
├── save_file_gcs.py            # Google Cloud Storage utilities
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (không commit)
├── .env.example                # Template cho environment variables
└── .gitignore                  # Git ignore rules
```

## 🚀 Cài đặt và chạy (Setup & Run)

### 1. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 2. Cấu hình environment variables

Sao chép `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

Xem chi tiết trong file [SETUP.md](./SETUP.md)

### 3. Chạy ứng dụng

**Development mode:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Production mode:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Truy cập API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/

## 📚 API Endpoints

### Health Check
- `GET /` - API information và health status
- `GET /health` - Detailed health check

### Excel Scanner
- `POST /api/excel/scan-upload` - Upload và quét file Excel
- `POST /api/excel/scan-upload-gcs` - Upload, quét và lưu lên GCS
- `GET /api/excel/scan-history` - Lấy lịch sử quét
- `GET /api/excel/scan-history/{scan_id}` - Lấy kết quả quét theo ID
- `DELETE /api/excel/scan-history/{scan_id}` - Xóa kết quả quét
- `GET /api/excel/stats` - Thống kê quét file
- `GET /api/excel/gcs-config` - Cấu hình GCS
- `GET /api/excel/batch-upload-limits` - Giới hạn upload

### Mapping Rules
- `POST /api/mapping-exports` - Tạo mapping rule mới
- `GET /api/mapping-exports` - Lấy danh sách mapping rules
- `GET /api/mapping-exports/{mapping_id}` - Lấy mapping rule theo ID
- `PUT /api/mapping-exports/{mapping_id}` - Cập nhật mapping rule
- `DELETE /api/mapping-exports/{mapping_id}` - Xóa mapping rule
- `POST /api/mapping-exports/debug-mappings` - Debug mapping data

## 🏗️ Kiến trúc (Architecture)

### Layered Architecture

```
┌─────────────────────────────────────┐
│         main.py (Entry Point)       │
│  - FastAPI app initialization       │
│  - Middleware setup                 │
│  - Router registration              │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────┐
│   Routers   │  │   Config   │
│  - excel    │  │  - Settings│
│  - mapping  │  │  - Env vars│
└──────┬──────┘  └────────────┘
       │
┌──────▼──────────────────────┐
│        Schemas (Pydantic)    │
│  - Request validation        │
│  - Response serialization    │
└──────┬──────────────────────┘
       │
┌──────▼──────────────────────┐
│     Database Layer           │
│  - Models (SQLAlchemy)       │
│  - Session management        │
└──────────────────────────────┘
```

### Các module chính

1. **`config.py`**: Quản lý tất cả cấu hình từ environment variables
2. **`database.py`**: Setup database engine, session, và Base
3. **`models.py`**: SQLAlchemy ORM models
4. **`schemas.py`**: Pydantic models cho request/response validation
5. **`routers/`**: API endpoints được tổ chức theo chức năng
6. **`main.py`**: Entry point, khởi tạo app và đăng ký routers

## 🔒 Bảo mật (Security)

- ✅ Thông tin nhạy cảm được lưu trong `.env` (không commit lên Git)
- ✅ CORS được cấu hình qua environment variables
- ✅ Input validation với Pydantic
- ✅ SQL injection protection với SQLAlchemy ORM
- ✅ File upload size limits

## 🧪 Testing

```bash
# Chạy tests (khi có)
pytest

# Chạy tests với coverage
pytest --cov=.
```

## 📝 Development Guidelines

### Thêm endpoint mới

1. Tạo schema trong `schemas.py` (nếu cần)
2. Thêm endpoint vào router tương ứng trong `routers/`
3. Test endpoint qua Swagger UI

### Thêm model mới

1. Định nghĩa model trong `models.py`
2. Tạo migration với Alembic
3. Chạy migration

### Thêm cấu hình mới

1. Thêm vào `.env.example`
2. Thêm vào class `Settings` trong `config.py`
3. Sử dụng `settings.YOUR_CONFIG` trong code

## 🐛 Troubleshooting

Xem chi tiết trong [SETUP.md](./SETUP.md)

## 📄 License

[Thêm license của bạn ở đây]

## 👥 Contributors

[Thêm thông tin contributors ở đây]
