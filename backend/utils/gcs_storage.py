import pandas as pd
from datetime import datetime
from pathlib import Path
import json
import hashlib
import uuid
import tempfile
import os
from typing import Optional, Dict, Any, Tuple, List
import io
import numpy as np

# Fix import GCS
try:
    from google.cloud import storage
    from google.cloud.exceptions import GoogleCloudError, Forbidden, NotFound
    GCS_AVAILABLE = True
    print("✅ Google Cloud Storage library loaded successfully")
except ImportError as e:
    GCS_AVAILABLE = False
    print(f"⚠️ Google Cloud Storage library not available: {e}")
    print("   GCS features will be disabled.")

# ==== GCS Configuration ====
GCS_BUCKET_NAME = "prod__cvs__ds__airbyte_sync__as__1"
GCS_RAW_FOLDER = "massive_sources_mapping/raw_data"
GCS_PROCESSED_FOLDER = "massive_sources_mapping/preprocessing_data"  
GCS_SCHEMA_FOLDER = "massive_sources_mapping/parsed_schemas"

CREDENTIALS_PATH = "sa-prod-ds-airbyte-sync@cvs-bigdata.json"

# ==== Utility Functions ====
def clean_for_json(data: Any) -> Any:
    """
    Clean data to make it JSON serializable by converting numpy/pandas types
    and handling non-serializable objects
    """
    if isinstance(data, dict):
        return {key: clean_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_for_json(item) for item in data]
    elif isinstance(data, tuple):
        return [clean_for_json(item) for item in data]
    elif isinstance(data, set):
        return list(data)
    elif isinstance(data, (np.int64, np.int32, np.int16, np.int8)):
        return int(data)
    elif isinstance(data, (np.float64, np.float32, np.float16)):
        return float(data)
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    elif pd.isna(data) or data is None:
        return None
    elif isinstance(data, (datetime, pd.Timestamp)):
        return data.isoformat()
    elif isinstance(data, pd.Series):
        return clean_for_json(data.tolist())
    elif isinstance(data, pd.DataFrame):
        return clean_for_json(data.to_dict('records'))
    elif isinstance(data, (str, int, float, bool)):
        return data
    else:
        # Try to convert to string as fallback
        try:
            return str(data)
        except Exception:
            return None

def save_to_local_fallback(data: bytes, filename: str, folder: str = "local_backup") -> Dict[str, Any]:
    """Save file to local fallback when GCS is not available"""
    try:
        # Create local folder if not exists
        local_folder = Path(folder)
        local_folder.mkdir(exist_ok=True)
        
        # Generate local file path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        local_path = local_folder / f"{timestamp}_{filename}"
        
        # Save file
        with open(local_path, 'wb') as f:
            f.write(data)
        
        return {
            "local_path": str(local_path),
            "file_size": len(data),
            "saved_at": datetime.now().isoformat(),
            "fallback_reason": "GCS unavailable"
        }
    except Exception as e:
        raise Exception(f"Local fallback save failed: {e}")

class GCSFileManager:
    """Manager class for handling file operations with Google Cloud Storage"""
    
    def __init__(self, bucket_name: str = GCS_BUCKET_NAME, credentials_path: str = None):
        """
        Initialize GCS File Manager
        
        Args:
            bucket_name: GCS bucket name
            credentials_path: Path to service account JSON file (optional)
        """
        self.bucket_name = bucket_name or GCS_BUCKET_NAME
        self.credentials_path = credentials_path or CREDENTIALS_PATH
        self.client = None
        self.gcs_enabled = False
        self.error_message = None
        
        if GCS_AVAILABLE:
            self._init_client()
        else:
            self.error_message = "Google Cloud Storage library not available"
            print("⚠️ GCS disabled - Google Cloud Storage library not available")
    
    def _init_client(self):
        """Khởi tạo GCS client với comprehensive error handling"""
        try:
            if not GCS_AVAILABLE:
                raise ImportError("Google Cloud Storage library not available")
            
            # Debug: Check bucket name
            print(f"🔍 Debug - Bucket name: '{self.bucket_name}' (type: {type(self.bucket_name)})")
            
            # Validate bucket name
            if not self.bucket_name or self.bucket_name == "string":
                raise ValueError(f"Invalid bucket name: '{self.bucket_name}'")
            
            # Initialize client based on available credentials
            client_initialized = False
            
            # Try 1: Service account key file
            if self.credentials_path and os.path.exists(self.credentials_path):
                try:
                    self.client = storage.Client.from_service_account_json(self.credentials_path)
                    client_initialized = True
                    print(f"✅ GCS client initialized with credentials file: {self.credentials_path}")
                except Exception as cred_error:
                    print(f"⚠️ Failed to use credentials file: {cred_error}")
            
            # Try 2: Environment variable
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                try:
                    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                    if os.path.exists(cred_path):
                        self.client = storage.Client()
                        client_initialized = True
                        print(f"✅ GCS client initialized with env credentials: {cred_path}")
                    else:
                        print(f"⚠️ Credentials file not found: {cred_path}")
                except Exception as env_error:
                    print(f"⚠️ Failed to use env credentials: {env_error}")
            
            # Try 3: Default credentials (works on GCP environments)
            if not client_initialized:
                try:
                    print("🔍 Trying to initialize with default credentials...")
                    self.client = storage.Client()
                    client_initialized = True
                    print(f"✅ GCS client initialized with default credentials")
                except Exception as default_error:
                    print(f"⚠️ Failed to use default credentials: {default_error}")
            
            if client_initialized:
                # Test connection với proper error handling
                try:
                    bucket = self.client.bucket(self.bucket_name)
                    # Try to get bucket metadata (lightweight operation)
                    bucket.reload()
                    self.gcs_enabled = True
                    print(f"✅ Successfully connected to bucket: {self.bucket_name}")
                    
                except Forbidden as forbidden_error:
                    self.error_message = f"Access denied to bucket '{self.bucket_name}': {forbidden_error}"
                    if "billing account" in str(forbidden_error).lower():
                        self.error_message += " - Billing account issue detected"
                    print(f"❌ {self.error_message}")
                    
                except NotFound as notfound_error:
                    self.error_message = f"Bucket '{self.bucket_name}' not found: {notfound_error}"
                    print(f"❌ {self.error_message}")
                    
                except GoogleCloudError as gcp_error:
                    self.error_message = f"GCP error: {gcp_error}"
                    print(f"❌ {self.error_message}")
                    
                except Exception as test_error:
                    self.error_message = f"Connection test failed: {test_error}"
                    print(f"❌ {self.error_message}")
            else:
                self.error_message = "Failed to initialize GCS client with any available credentials"
                print(f"❌ {self.error_message}")
                
        except Exception as e:
            self.error_message = f"GCS initialization failed: {e}"
            print(f"❌ {self.error_message}")
            print(f"   Credentials path: {self.credentials_path}")
            print(f"   GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'Not set')}")
            print("   GCS will be disabled - falling back to local storage.")
            self.gcs_enabled = False
            self.client = None
            
    def is_enabled(self) -> bool:
        """Check if GCS is enabled and available"""
        return self.gcs_enabled
    
    def get_status(self) -> dict:
        """Get detailed status information"""
        return {
            "gcs_available": GCS_AVAILABLE,
            "gcs_enabled": getattr(self, 'gcs_enabled', False),
            "credentials_path": getattr(self, 'credentials_path', None),
            "credentials_exists": os.path.exists(getattr(self, 'credentials_path', '') or ''),
            "bucket_name": getattr(self, 'bucket_name', None),
            "client_initialized": self.client is not None,
            "error_message": getattr(self, 'error_message', None)
        }
    
    def _generate_file_metadata(self, original_filename: str, content_type: str = None) -> dict:
        """Generate common file metadata"""
        timestamp = datetime.now().isoformat()
        return {
            "original_filename": original_filename,
            "upload_timestamp": timestamp,
            "content_type": content_type or "application/octet-stream",
            "file_id": str(uuid.uuid4())
        }
    
    def _upload_to_gcs(self, folder: str, filename: str, content: bytes, 
                       metadata: dict = None) -> dict:
        """Common method to upload content to GCS"""
        if not self.gcs_enabled:
            raise RuntimeError(f"GCS not enabled - {self.error_message or 'check credentials and configuration'}")
        
        try:
            # Construct GCS path
            gcs_path = f"{folder}/{filename}"
            
            # Get bucket and blob
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(gcs_path)
            
            # Upload content
            blob.upload_from_string(content)
            
            # Set metadata if provided
            if metadata:
                blob.metadata = metadata
                blob.patch()
            
            # Return upload info with proper structure
            return {
                "gcs_path": gcs_path,
                "gcs_uri": f"gs://{self.bucket_name}/{gcs_path}",
                "bucket_name": self.bucket_name,
                "blob_name": gcs_path,
                "public_url": blob.public_url,
                "file_size": len(content),
                "uploaded_at": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            
        except Exception as e:
            raise Exception(f"Failed to upload to GCS: {e}")
    
    def save_raw_file(self, file_content: bytes, original_filename: str) -> Dict[str, Any]:
        """Lưu file raw với fallback to local storage"""
        try:
            if self.gcs_enabled:
                # Try GCS first
                metadata = self._generate_file_metadata(original_filename, "application/octet-stream")
                
                file_hash = hashlib.md5(file_content).hexdigest()[:8]
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_filename = Path(original_filename).stem
                gcs_filename = f"{safe_filename}.xlsx"
                
                gcs_raw_folder = f"{GCS_RAW_FOLDER}/{datetime.now().strftime('%Y/%m/%d')}"
                upload_info = self._upload_to_gcs(gcs_raw_folder, gcs_filename, file_content, metadata)
                return upload_info
            else:
                # Fallback to local storage
                return save_to_local_fallback(file_content, f"raw_{original_filename}", "local_backup/raw_files")
                
        except Exception as e:
            # If GCS fails, try local fallback
            try:
                fallback_result = save_to_local_fallback(file_content, f"raw_{original_filename}", "local_backup/raw_files")
                fallback_result["fallback_reason"] = f"GCS failed: {str(e)}"
                return fallback_result
            except Exception as fallback_error:
                raise Exception(f"Both GCS and local fallback failed - GCS: {e}, Local: {fallback_error}")
        
    def save_processed_file(self, df: pd.DataFrame, original_filename: str, 
                         sheet_name: str = None, header_row_idx: int = 0) -> Dict[str, Any]:
        """Lưu file processed với fallback to local storage"""
        try:
            # Convert DataFrame to CSV bytes
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_content = csv_buffer.getvalue().encode('utf-8')
            
            if self.gcs_enabled:
                # Try GCS first
                metadata = self._generate_file_metadata(original_filename, "text/csv")
                metadata.update({
                    "sheet_name": sheet_name or "Sheet1",
                    "header_row": header_row_idx,
                    "data_rows": len(df),
                    "data_cols": len(df.columns),
                    "column_names": list(df.columns)
                })
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_filename = Path(original_filename).stem
                sheet_suffix = f"_{sheet_name}" if sheet_name else ""
                gcs_filename = f"{safe_filename}_____{sheet_suffix}.csv"
                
                gcs_processed_folder = f"{GCS_PROCESSED_FOLDER}/{datetime.now().strftime('%Y/%m/%d')}"
                upload_info = self._upload_to_gcs(gcs_processed_folder, gcs_filename, csv_content, metadata)
                
                # Add processing info
                upload_info.update({
                    "data_rows": len(df),
                    "data_cols": len(df.columns),
                    "sheet_name": sheet_name,
                    "header_row_idx": header_row_idx
                })
                
                return upload_info
            else:
                # Fallback to local storage
                processed_filename = f"processed_{sheet_name or 'sheet'}_{original_filename}.csv"
                fallback_result = save_to_local_fallback(csv_content, processed_filename, "local_backup/processed_files")
                fallback_result.update({
                    "data_rows": len(df),
                    "data_cols": len(df.columns),
                    "sheet_name": sheet_name,
                    "header_row_idx": header_row_idx
                })
                return fallback_result
                
        except Exception as e:
            # If GCS fails, try local fallback
            try:
                processed_filename = f"processed_{sheet_name or 'sheet'}_{original_filename}.csv"
                fallback_result = save_to_local_fallback(csv_content, processed_filename, "local_backup/processed_files")
                fallback_result.update({
                    "fallback_reason": f"GCS failed: {str(e)}",
                    "data_rows": len(df),
                    "data_cols": len(df.columns),
                    "sheet_name": sheet_name,
                    "header_row_idx": header_row_idx
                })
                return fallback_result
            except Exception as fallback_error:
                raise Exception(f"Both GCS and local fallback failed - GCS: {e}, Local: {fallback_error}")
        
    def save_schema_json(self, schema_data: Dict, original_filename: str) -> Dict[str, Any]:
        """Lưu schema JSON với fallback to local storage"""
        try:
            # Clean data for JSON serialization
            clean_schema = clean_for_json(schema_data)
            json_content = json.dumps(clean_schema, indent=2, ensure_ascii=False).encode('utf-8')
            
            if self.gcs_enabled:
                # Try GCS first
                metadata = self._generate_file_metadata(original_filename, "application/json")
                metadata.update({
                    "schema_version": "1.0",
                    "total_sheets": len(clean_schema.get("sheets", [])),
                    "schema_size": len(json_content)
                })
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_filename = Path(original_filename).stem.replace(" ", "_")
                gcs_filename = f"{safe_filename}______{timestamp}.json"
                
                gcs_schema_folder = f"{GCS_SCHEMA_FOLDER}/{datetime.now().strftime('%Y/%m/%d')}"
                upload_info = self._upload_to_gcs(gcs_schema_folder, gcs_filename, json_content, metadata)
                
                # Add schema info
                upload_info.update({
                    "schema_size": len(json_content),
                    "total_sheets": len(clean_schema.get("sheets", []))
                })
                
                return upload_info
            else:
                # Fallback to local storage
                schema_filename = f"schema_{original_filename}.json"
                fallback_result = save_to_local_fallback(json_content, schema_filename, "local_backup/schemas")
                fallback_result.update({
                    "schema_size": len(json_content),
                    "total_sheets": len(clean_schema.get("sheets", []))
                })
                return fallback_result
                
        except Exception as e:
            # If GCS fails, try local fallback
            try:
                schema_filename = f"schema_{original_filename}.json"
                fallback_result = save_to_local_fallback(json_content, schema_filename, "local_backup/schemas")
                fallback_result.update({
                    "fallback_reason": f"GCS failed: {str(e)}",
                    "schema_size": len(json_content),
                    "total_sheets": len(clean_schema.get("sheets", []))
                })
                return fallback_result
            except Exception as fallback_error:
                raise Exception(f"Both GCS and local fallback failed - GCS: {e}, Local: {fallback_error}")
    
    def save_complete_scan_result(self, file_content: bytes, original_filename: str, 
                                scan_result: Dict, processed_files_info: List[Dict] = None) -> Dict[str, Any]:
        """Lưu toàn bộ kết quả scan với robust error handling"""
        results = {
            "scan_id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "original_filename": original_filename,
            "storage_method": "gcs" if self.gcs_enabled else "local_fallback"
        }
        
        # 1. Save raw file
        try:
            raw_result = self.save_raw_file(file_content, original_filename)
            results["raw_file"] = raw_result
            storage_type = "GCS" if "gcs_uri" in raw_result else "Local"
            print(f"        💾 Raw file saved to {storage_type}")
        except Exception as e:
            print(f"⚠️ Failed to save raw file: {e}")
            results["raw_file"] = {"error": str(e)}
        
        # 2. Save schema
        try:
            schema_result = self.save_schema_json(scan_result, original_filename)
            results["schema"] = schema_result
            storage_type = "GCS" if "gcs_uri" in schema_result else "Local"
            print(f"        💾 Schema saved to {storage_type}")
        except Exception as e:
            print(f"⚠️ Failed to save schema: {e}")
            results["schema"] = {"error": str(e)}
        
        # 3. Collect processed files info
        results["processed_files"] = processed_files_info or []
        
        # 4. Add status info
        if not self.gcs_enabled and self.error_message:
            results["gcs_disabled_reason"] = self.error_message
        
        return results

# ==== Safe wrapper function ====
def safe_gcs_operation(gcs_manager, operation_name, operation_func, *args, **kwargs):
    """
    Wrapper function để thực hiện GCS operations một cách an toàn
    """
    try:
        result = operation_func(*args, **kwargs)
        storage_type = "GCS" if gcs_manager.is_enabled() else "Local fallback"
        print(f"✅ {operation_name} successful ({storage_type})")
        return result
    except Exception as e:
        print(f"❌ {operation_name} failed: {e}")
        return {"error": str(e)}

# ==== Usage example ====
def example_usage():
    """Ví dụ cách sử dụng GCSFileManager với robust error handling"""
    
    # Khởi tạo manager
    gcs_manager = GCSFileManager()
    
    # Kiểm tra trạng thái
    status = gcs_manager.get_status()
    print("GCS Status:", json.dumps(status, indent=2))
    
    # Luôn thử save - sẽ fallback to local nếu GCS fail
    print("🚀 Testing file save operations...")
    
    sample_data = b"sample file content"
    sample_scan_result = {
        "file_info": {"name": "test.xlsx", "size": len(sample_data)},
        "sheets": [{"name": "Sheet1", "headers": ["A", "B", "C"], "rows": 10}]
    }
    
    # Sử dụng safe wrapper
    result = safe_gcs_operation(
        gcs_manager, 
        "Complete scan save",
        gcs_manager.save_complete_scan_result,
        file_content=sample_data,
        original_filename="test.xlsx",
        scan_result=sample_scan_result
    )
    
    if result and not result.get("error"):
        print(f"✅ Scan ID: {result['scan_id']}")
        print(f"📁 Storage method: {result['storage_method']}")
        if "raw_file" in result:
            print(f"📄 Raw file: {'✅' if not result['raw_file'].get('error') else '❌'}")
        if "schema" in result:
            print(f"📋 Schema: {'✅' if not result['schema'].get('error') else '❌'}")
    else:
        print("⚠️ Save operation completed with issues")

# ==== Debug function ====
def debug_gcs_setup():
    """Debug function để check GCS setup"""
    print("🔍 Debugging GCS setup...")
    
    print(f"1. GCS_AVAILABLE: {GCS_AVAILABLE}")
    print(f"2. Credentials file exists: {os.path.exists(CREDENTIALS_PATH)}")
    print(f"3. GOOGLE_APPLICATION_CREDENTIALS env: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'Not set')}")
    print(f"4. Current working directory: {os.getcwd()}")
    print(f"5. Target bucket: {GCS_BUCKET_NAME}")
    
    if GCS_AVAILABLE:
        print("6. Testing GCS manager initialization...")
        try:
            manager = GCSFileManager()
            status = manager.get_status()
            print("   Status:", json.dumps(status, indent=4))
        except Exception as e:
            print(f"   Error: {e}")
    else:
        print("6. Cannot test GCS manager - library not available")

# ==== Wrapper Functions for Easy Import ===
def upload_to_gcs(file_content: bytes, destination_blob_name: str, bucket_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Upload file content to GCS
    
    Args:
        file_content: File content as bytes
        destination_blob_name: Destination path in GCS
        bucket_name: GCS bucket name (optional)
        
    Returns:
        Dict with upload info or None if failed
    """
    try:
        manager = GCSFileManager(bucket_name=bucket_name)
        if not manager.gcs_enabled:
            print(f"⚠️ GCS not available: {manager.error_message}")
            return None
        
        result = manager.upload_file(file_content, destination_blob_name)
        return result
    except Exception as e:
        print(f"❌ Error uploading to GCS: {e}")
        return None


def upload_dataframe_to_gcs(df: pd.DataFrame, destination_blob_name: str, bucket_name: Optional[str] = None, format: str = 'parquet') -> Optional[Dict[str, Any]]:
    """
    Upload pandas DataFrame to GCS
    
    Args:
        df: Pandas DataFrame
        destination_blob_name: Destination path in GCS
        bucket_name: GCS bucket name (optional)
        format: File format ('parquet', 'csv', 'json')
        
    Returns:
        Dict with upload info or None if failed
    """
    try:
        manager = GCSFileManager(bucket_name=bucket_name)
        if not manager.gcs_enabled:
            print(f"⚠️ GCS not available: {manager.error_message}")
            return None
        
        # Convert DataFrame to bytes based on format
        buffer = io.BytesIO()
        if format == 'parquet':
            df.to_parquet(buffer, index=False)
        elif format == 'csv':
            df.to_csv(buffer, index=False)
        elif format == 'json':
            df.to_json(buffer, orient='records')
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        file_content = buffer.getvalue()
        result = manager.upload_file(file_content, destination_blob_name)
        return result
    except Exception as e:
        print(f"❌ Error uploading DataFrame to GCS: {e}")
        return None


def upload_json_to_gcs(data: Any, destination_blob_name: str, bucket_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Upload JSON data to GCS
    
    Args:
        data: Data to upload (will be converted to JSON)
        destination_blob_name: Destination path in GCS
        bucket_name: GCS bucket name (optional)
        
    Returns:
        Dict with upload info or None if failed
    """
    try:
        manager = GCSFileManager(bucket_name=bucket_name)
        if not manager.gcs_enabled:
            print(f"⚠️ GCS not available: {manager.error_message}")
            return None
        
        result = manager.upload_json(data, destination_blob_name)
        return result
    except Exception as e:
        print(f"❌ Error uploading JSON to GCS: {e}")
        return None


def get_gcs_client(bucket_name: Optional[str] = None, credentials_path: Optional[str] = None):
    """
    Get GCS client
    
    Args:
        bucket_name: GCS bucket name (optional)
        credentials_path: Path to credentials file (optional)
        
    Returns:
        GCS client or None if not available
    """
    try:
        manager = GCSFileManager(bucket_name=bucket_name, credentials_path=credentials_path)
        if manager.gcs_enabled:
            return manager.client
        return None
    except Exception as e:
        print(f"❌ Error getting GCS client: {e}")
        return None


if __name__ == "__main__":
    debug_gcs_setup()
    print("\n" + "="*50 + "\n")
    example_usage()