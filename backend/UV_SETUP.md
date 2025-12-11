# UV Setup Guide

This project uses `uv` - a modern, fast Python package manager that is significantly faster than pip.

## Installation

### 1. Install UV

```bash
# Windows (PowerShell)
pip install uv

# Linux/Mac
pip install uv
# or
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Verify Installation

```bash
uv --version
```

## Quick Start

### Local Development

```bash
# 1. Sync dependencies (creates .venv and installs packages)
uv sync

# 2. Activate virtual environment
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# 3. Run application
python main.py

# Or run directly (no activation needed)
uv run python main.py
```

### Docker

```bash
# Build image
docker compose build --no-cache

# Start containers
docker compose up -d

# View logs
docker compose logs -f api
```

## Project Structure

```
project/
├── pyproject.toml          # Project configuration & dependencies
├── uv.lock                 # Lock file (auto-generated)
├── .venv/                  # Virtual environment (auto-created)
├── requirements.txt        # Legacy (optional, for reference)
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── main.py                 # Application entry point
├── core/                   # Core modules
├── features/               # Feature modules
└── utils/                  # Utility modules
```

## Common Commands

### Dependency Management

```bash
# Sync all dependencies
uv sync

# Add new dependency
uv pip install package-name

# Remove dependency
uv pip uninstall package-name

# Update dependencies
uv sync --upgrade

# View installed packages
uv pip list
```

### Running Code

```bash
# Run Python script
uv run python main.py

# Run with specific Python version
uv run --python 3.11 python main.py

# Run tests
uv run pytest

# Run linter
uv run black .
uv run flake8 .
```

### Virtual Environment

```bash
# Create venv
uv venv

# Activate venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Deactivate venv
deactivate
```

## pyproject.toml Sections

### Project Metadata
```toml
[project]
name = "mapping-export-api"
version = "2.1.0"
description = "..."
requires-python = ">=3.10"
```

### Dependencies
```toml
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    # ...
]
```

### Optional Dependencies
```toml
[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "black>=23.0.0",
    # ...
]

# Install with: uv sync --extra dev
```

### Tool Configuration
```toml
[tool.black]
line-length = 120

[tool.isort]
profile = "black"

[tool.mypy]
python_version = "3.10"
```

## Docker with UV

The Dockerfile has been updated to use `uv`:

```dockerfile
# Install uv
RUN pip install --no-cache-dir uv

# Install dependencies
RUN uv pip install --system -r pyproject.toml
```

**Benefits:**
- ⚡ Faster dependency installation
- 📦 Better version management
- 🔒 Consistent builds

## Migration from requirements.txt

If you still use `requirements.txt`:

```bash
# Create pyproject.toml from requirements.txt
uv pip compile requirements.txt -o pyproject.toml

# Or install from requirements.txt
uv pip install -r requirements.txt
```

## Performance

`uv` is significantly faster than pip:

| Operation | pip | uv |
|-----------|-----|-----|
| Install 100 packages | ~30s | ~3s |
| Resolve dependencies | ~10s | ~1s |
| Lock file generation | Manual | Auto |

## Troubleshooting

### Issue: `uv: command not found`

```bash
# Reinstall uv
pip install --upgrade uv

# Verify
uv --version
```

### Issue: `.venv` not created

```bash
# Create venv manually
uv venv

# Sync dependencies
uv sync
```

### Issue: Dependency conflict

```bash
# Clear cache and sync again
rm -rf .venv uv.lock
uv sync
```

## Resources

- [UV Documentation](https://docs.astral.sh/uv/)
- [pyproject.toml Spec](https://packaging.python.org/en/latest/specifications/pyproject-toml/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

**Last Updated:** 2025-01-28
