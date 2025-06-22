"""
Utility functions and helpers for common operations.
"""
import os
import re
import json
import hashlib
import logging
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union, BinaryIO, Tuple, Callable, TypeVar, Type, cast
from functools import wraps
import uuid
import mimetypes
import magic
from urllib.parse import urlparse, unquote

import aiofiles
from fastapi import UploadFile, HTTPException, status
from pydantic import BaseModel, ValidationError

from config import settings

logger = logging.getLogger(__name__)

# Type variable for generic type hints
T = TypeVar('T')

def generate_uuid() -> str:
    """Generate a UUID4 string."""
    return str(uuid.uuid4())

def get_timestamp() -> str:
    """Get current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()

def parse_timestamp(ts: Union[str, datetime]) -> datetime:
    """Parse a timestamp string or datetime object to a timezone-aware datetime."""
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts
    
    try:
        # Try ISO format
        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        # Try common timestamp formats
        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y%m%d%H%M%S"]:
            try:
                dt = datetime.strptime(ts, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
    
    raise ValueError(f"Could not parse timestamp: {ts}")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    import bcrypt
    
    salt = bcrypt.gensalt(rounds=settings.SECURITY_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    import bcrypt
    
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except (ValueError, TypeError):
        return False

def generate_api_key(prefix: str = "tk") -> str:
    """Generate a random API key with an optional prefix."""
    random_part = uuid.uuid4().hex
    return f"{prefix}_{random_part}"

def validate_email(email: str) -> bool:
    """Validate an email address format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def normalize_string(s: str) -> str:
    """Normalize a string by converting to lowercase and removing extra whitespace."""
    return ' '.join(s.strip().split())

def to_camel_case(snake_str: str) -> str:
    """Convert a snake_case string to camelCase."""
    components = snake_str.split('_')
    return components[0].lower() + ''.join(x.title() for x in components[1:])

def to_snake_case(camel_str: str) -> str:
    """Convert a camelCase string to snake_case."""
    return ''.join(['_'+c.lower() if c.isupper() else c for c in camel_str]).lstrip('_')

class FileHandler:
    """Utility class for file operations."""
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Get the file extension from a filename."""
        return Path(filename).suffix.lower()
    
    @staticmethod
    def is_allowed_file(filename: str, allowed_extensions: list = None) -> bool:
        """Check if a file has an allowed extension."""
        if allowed_extensions is None:
            allowed_extensions = settings.ALLOWED_FILE_TYPES
            
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in allowed_extensions
    
    @staticmethod
    def get_mime_type(file_path: Union[str, Path]) -> str:
        """Get the MIME type of a file."""
        mime = magic.Magic(mime=True)
        return mime.from_file(str(file_path))
    
    @staticmethod
    async def save_upload_file(upload_file: UploadFile, destination: Union[str, Path]) -> Path:
        """Save an uploaded file to the specified destination."""
        destination = Path(destination)
        
        # Create directory if it doesn't exist
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        # Save the file
        file_path = destination / upload_file.filename
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await upload_file.read(1024 * 1024):  # Read in 1MB chunks
                await out_file.write(content)
        
        return file_path
    
    @staticmethod
    async def read_file_chunks(file_path: Union[str, Path], chunk_size: int = 1024 * 1024):
        """Read a file in chunks to avoid loading large files into memory."""
        file_path = Path(file_path)
        
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(chunk_size):
                yield chunk
    
    @staticmethod
    def get_file_hash(file_path: Union[str, Path], algorithm: str = 'sha256') -> str:
        """Calculate the hash of a file."""
        file_path = Path(file_path)
        hash_func = getattr(hashlib, algorithm)()
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_func.update(chunk)
        
        return hash_func.hexdigest()
    
    @staticmethod
    def create_temp_file(content: bytes, suffix: str = None, prefix: str = None) -> str:
        """Create a temporary file with the given content."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix=prefix) as f:
            f.write(content)
            return f.name
    
    @staticmethod
    def cleanup_temp_file(file_path: str) -> None:
        """Delete a temporary file if it exists."""
        try:
            os.unlink(file_path)
        except (OSError, TypeError):
            pass

class DataValidator:
    """Utility class for data validation and sanitization."""
    
    @staticmethod
    def validate_pydantic(model: Type[BaseModel], data: dict) -> Tuple[bool, Union[BaseModel, dict]]:
        """Validate data against a Pydantic model."""
        try:
            return True, model(**data)
        except ValidationError as e:
            return False, e.errors()
    
    @staticmethod
    def sanitize_input(input_data: Union[str, dict, list]) -> Union[str, dict, list]:
        """Sanitize input to prevent XSS and injection attacks."""
        if isinstance(input_data, str):
            # Basic XSS protection
            return input_data.replace('<', '&lt;').replace('>', '&gt;')
        elif isinstance(input_data, dict):
            return {k: DataValidator.sanitize_input(v) for k, v in input_data.items()}
        elif isinstance(input_data, list):
            return [DataValidator.sanitize_input(item) for item in input_data]
        return input_data
    
    @staticmethod
    def is_valid_json(json_str: str) -> bool:
        """Check if a string is valid JSON."""
        try:
            json.loads(json_str)
            return True
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate a URL."""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except (ValueError, AttributeError):
            return False

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    _instance = None
    _rates = {}
    _hits = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RateLimiter, cls).__new__(cls)
        return cls._instance
    
    def set_rate_limit(self, key: str, max_requests: int, window: int):
        """Set a rate limit for a key."""
        self._rates[key] = (max_requests, window)
    
    def is_rate_limited(self, key: str) -> bool:
        """Check if a key is rate limited."""
        if key not in self._rates:
            return False
            
        max_requests, window = self._rates[key]
        now = time.time()
        
        if key not in self._hits:
            self._hits[key] = []
        
        # Remove hits outside the current window
        self._hits[key] = [t for t in self._hits[key] if now - t < window]
        
        if len(self._hits[key]) >= max_requests:
            return True
            
        self._hits[key].append(now)
        return False

# Global instances
file_handler = FileHandler()
data_validator = DataValidator()
rate_limiter = RateLimiter()

def async_retry(max_retries: int = 3, delay: float = 1.0):
    """Decorator for retrying async functions with exponential backoff."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt == max_retries - 1:
                        raise
                    
                    wait = delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {wait} seconds...")
                    await asyncio.sleep(wait)
            
            raise last_exception
        return wrapper
    return decorator
