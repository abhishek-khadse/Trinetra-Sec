"""
Utility functions package.

This package contains various utility functions used throughout the application.
"""
import hashlib
import json
import os
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, TypeVar, Type, Union, Callable, Tuple

# Import the new utility modules
from .logger import (
    get_logger,
    configure_logging,
    JsonFormatter,
    ContextFilter,
    RequestLogger,
    log_exception,
    logger,
    http_logger,
    db_logger,
    auth_logger,
    api_logger,
    ml_logger
)

from .helpers import (
    generate_uuid,
    get_timestamp,
    parse_timestamp,
    hash_password,
    verify_password,
    generate_api_key,
    validate_email,
    normalize_string,
    to_camel_case,
    to_snake_case,
    file_handler,
    data_validator,
    rate_limiter
)

from .responses import (
    ResponseStatus,
    ErrorCode,
    ErrorResponse,
    Pagination,
    BaseResponse,
    SuccessResponse,
    ErrorResponseModel,
    success_response,
    error_response,
    paginated_response,
    not_found_response,
    unauthorized_response,
    forbidden_response,
    validation_error_response,
    internal_error_response,
    OK,
    ACCEPTED,
    NO_CONTENT
)
from datetime import datetime, timezone
import uuid
import aiofiles

T = TypeVar('T')

# Re-export the original utility functions for backward compatibility
# These are now implemented in the helpers module

# File operations
def read_json_file(file_path: Union[str, Path]) -> Any:
    """Read JSON data from a file asynchronously."""
    return file_handler.read_json_file(file_path)

def write_json_file(file_path: Union[str, Path], data: Any) -> None:
    """Write JSON data to a file asynchronously."""
    return file_handler.write_json_file(file_path, data)

def calculate_file_hash(file_path: Union[str, Path], hash_algorithm: str = 'sha256') -> str:
    """Calculate the hash of a file."""
    return file_handler.get_file_hash(file_path, hash_algorithm)

def get_file_extension(filename: str) -> str:
    """Get the file extension from a filename."""
    return file_handler.get_file_extension(filename)

def is_safe_path(base_path: Union[str, Path], path: Union[str, Path]) -> bool:
    """Check if a path is safe and within the base directory."""
    try:
        base_path = Path(base_path).resolve()
        path = Path(path).resolve()
        return base_path in path.parents or path == base_path
    except (RuntimeError, OSError):
        return False

def format_bytes(size: float) -> str:
    """Format bytes to a human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} PB"

__all__ = [
    'generate_uuid',
    'get_timestamp',
    'read_json_file',
    'write_json_file',
    'calculate_file_hash',
    'get_file_extension',
    'is_safe_path',
    'format_bytes',
]
