"""
Standardized API response utilities.
"""
from typing import Any, Dict, List, Optional, Union, TypeVar, Generic, Type
from pydantic import BaseModel, Field
from fastapi import status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime
from enum import Enum
import logging

from .helpers import get_timestamp
from config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T')

class ResponseStatus(str, Enum):
    """Standard response status values."""
    SUCCESS = "success"
    ERROR = "error"
    PARTIAL = "partial"
    PENDING = "pending"

class ErrorCode(str, Enum):
    """Standard error codes."""
    # General errors (1000-1999)
    UNKNOWN_ERROR = "1000"
    VALIDATION_ERROR = "1001"
    NOT_FOUND = "1002"
    PERMISSION_DENIED = "1003"
    UNAUTHORIZED = "1004"
    RATE_LIMIT_EXCEEDED = "1005"
    INTERNAL_SERVER_ERROR = "1006"
    BAD_REQUEST = "1007"
    CONFLICT = "1008"
    NOT_IMPLEMENTED = "1009"
    
    # Authentication errors (2000-2999)
    INVALID_CREDENTIALS = "2000"
    ACCOUNT_DISABLED = "2001"
    ACCOUNT_LOCKED = "2002"
    TOKEN_EXPIRED = "2003"
    INVALID_TOKEN = "2004"
    INVALID_REFRESH_TOKEN = "2005"
    INVALID_GRANT = "2006"
    
    # Resource errors (3000-3999)
    RESOURCE_NOT_FOUND = "3000"
    RESOURCE_EXISTS = "3001"
    RESOURCE_LIMIT_REACHED = "3002"
    
    # Validation errors (4000-4999)
    INVALID_EMAIL = "4000"
    INVALID_PASSWORD = "4001"
    INVALID_INPUT = "4002"
    MISSING_REQUIRED_FIELD = "4003"
    
    # Business logic errors (5000-5999)
    OPERATION_NOT_ALLOWED = "5000"
    QUOTA_EXCEEDED = "5001"
    
    # External service errors (6000-6999)
    EXTERNAL_SERVICE_ERROR = "6000"
    EXTERNAL_SERVICE_TIMEOUT = "6001"
    EXTERNAL_SERVICE_UNAVAILABLE = "6002"
    
    # File and storage errors (7000-7999)
    FILE_TOO_LARGE = "7000"
    INVALID_FILE_TYPE = "7001"
    UPLOAD_FAILED = "7002"
    STORAGE_ERROR = "7003"
    
    # WebSocket errors (8000-8999)
    WEBSOCKET_CONNECTION_ERROR = "8000"
    WEBSOCKET_AUTH_ERROR = "8001"
    WEBSOCKET_RATE_LIMIT = "8002"

class ErrorResponse(BaseModel):
    """Standard error response model."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "1001",
                "message": "Validation error",
                "details": {"field": "email", "error": "Invalid email format"}
            }
        }

class Pagination(BaseModel):
    """Pagination metadata model."""
    total: int
    page: int
    page_size: int
    total_pages: int
    
    @classmethod
    def create(cls, total: int, page: int, page_size: int) -> 'Pagination':
        """Create a pagination object."""
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

class BaseResponse(BaseModel, Generic[T]):
    """Base response model for all API responses."""
    status: ResponseStatus = Field(..., description="Response status (success, error, etc.)")
    data: Optional[T] = None
    error: Optional[ErrorResponse] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=get_timestamp, description="ISO 8601 timestamp of the response")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "data": {"key": "value"},
                "error": None,
                "meta": {"page": 1, "total": 100},
                "timestamp": "2023-01-01T12:00:00Z"
            }
        }

class SuccessResponse(BaseResponse[T]):
    """Standard success response."""
    status: ResponseStatus = ResponseStatus.SUCCESS
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "data": {"key": "value"},
                "error": None,
                "meta": {"page": 1, "total": 100},
                "timestamp": "2023-01-01T12:00:00Z"
            }
        }

class ErrorResponseModel(BaseResponse[T]):
    """Standard error response."""
    status: ResponseStatus = ResponseStatus.ERROR
    data: Optional[T] = None
    error: ErrorResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "data": None,
                "error": {
                    "code": "1001",
                    "message": "Validation error",
                    "details": {"field": "email", "error": "Invalid email format"}
                },
                "meta": None,
                "timestamp": "2023-01-01T12:00:00Z"
            }
        }

def success_response(
    data: Any = None,
    status_code: int = status.HTTP_200_OK,
    meta: Optional[Dict[str, Any]] = None,
    **kwargs
) -> JSONResponse:
    """Create a standardized success response.
    
    Args:
        data: The response data
        status_code: HTTP status code
        meta: Additional metadata
        **kwargs: Additional fields to include in the response
        
    Returns:
        JSONResponse: The formatted response
    """
    response_data = SuccessResponse[Any](
        status=ResponseStatus.SUCCESS,
        data=data,
        meta=meta or {},
        **kwargs
    ).model_dump(exclude_none=True)
    
    return JSONResponse(
        content=jsonable_encoder(response_data),
        status_code=status_code
    )

def error_response(
    message: str,
    code: Union[str, ErrorCode],
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Optional[Dict[str, Any]] = None,
    **kwargs
) -> JSONResponse:
    """Create a standardized error response.
    
    Args:
        message: Error message
        code: Error code (string or ErrorCode enum)
        status_code: HTTP status code
        details: Additional error details
        **kwargs: Additional fields to include in the response
        
    Returns:
        JSONResponse: The formatted error response
    """
    error_code = code.value if isinstance(code, ErrorCode) else code
    
    response_data = ErrorResponseModel[None](
        status=ResponseStatus.ERROR,
        error=ErrorResponse(
            code=error_code,
            message=message,
            details=details or {}
        ),
        **kwargs
    ).model_dump(exclude_none=True)
    
    return JSONResponse(
        content=jsonable_encoder(response_data),
        status_code=status_code
    )

def paginated_response(
    items: List[Any],
    total: int,
    page: int,
    page_size: int,
    **kwargs
) -> JSONResponse:
    """Create a paginated response.
    
    Args:
        items: List of items in the current page
        total: Total number of items
        page: Current page number (1-based)
        page_size: Number of items per page
        **kwargs: Additional fields to include in the response
        
    Returns:
        JSONResponse: The formatted paginated response
    """
    pagination = Pagination.create(total=total, page=page, page_size=page_size)
    
    meta = {
        "pagination": pagination.model_dump(),
        "count": len(items),
        **kwargs.pop("meta", {})
    }
    
    return success_response(
        data=items,
        meta=meta,
        **kwargs
    )

def not_found_response(
    resource: str = "Resource",
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """Create a 404 Not Found response."""
    return error_response(
        message=f"{resource} not found",
        code=ErrorCode.RESOURCE_NOT_FOUND,
        status_code=status.HTTP_404_NOT_FOUND,
        details=details or {}
    )

def unauthorized_response(
    message: str = "Not authenticated",
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """Create a 401 Unauthorized response."""
    return error_response(
        message=message,
        code=ErrorCode.UNAUTHORIZED,
        status_code=status.HTTP_401_UNAUTHORIZED,
        details=details or {}
    )

def forbidden_response(
    message: str = "Permission denied",
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """Create a 403 Forbidden response."""
    return error_response(
        message=message,
        code=ErrorCode.PERMISSION_DENIED,
        status_code=status.HTTP_403_FORBIDDEN,
        details=details or {}
    )

def validation_error_response(
    errors: List[Dict[str, Any]],
    message: str = "Validation error"
) -> JSONResponse:
    """Create a 422 Unprocessable Entity response for validation errors."""
    return error_response(
        message=message,
        code=ErrorCode.VALIDATION_ERROR,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"errors": errors}
    )

def internal_error_response(
    error: Exception,
    message: str = "Internal server error",
    include_details: bool = False
) -> JSONResponse:
    """Create a 500 Internal Server Error response."""
    logger.error(f"Internal server error: {str(error)}", exc_info=error)
    
    details = {}
    if include_details and settings.DEBUG:
        import traceback
        details = {
            "type": error.__class__.__name__,
            "message": str(error),
            "traceback": traceback.format_exc().splitlines()
        }
    
    return error_response(
        message=message,
        code=ErrorCode.INTERNAL_SERVER_ERROR,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details=details
    )

# Common response types
OK = success_response({"status": "ok"})
ACCEPTED = success_response({"status": "accepted"}, status_code=status.HTTP_202_ACCEPTED)
NO_CONTENT = JSONResponse(content=None, status_code=status.HTTP_204_NO_CONTENT)
