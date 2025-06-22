"""
Audit Logging Service

This module provides functionality for logging security-relevant events
and user activities for compliance and monitoring purposes.
"""
import json
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional, List, Union
from pathlib import Path
import os
import uuid

from pydantic import BaseModel, Field, validator
from fastapi import Request, HTTPException, status

from config import settings
from core.security.jwt import TokenPayload

# Configure logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Ensure log directory exists
LOG_DIR = Path("logs/audit")
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Configure file handler
file_handler = logging.FileHandler(LOG_DIR / "audit.log")
file_handler.setFormatter(
    logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
)
audit_logger.addHandler(file_handler)

# Add console handler for development
if settings.DEBUG:
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    audit_logger.addHandler(console_handler)

class AuditAction(str, Enum):
    """Enumeration of audit log actions."""
    # Authentication events
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    SIGNUP = "signup"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    PASSWORD_RESET = "password_reset"
    
    # User management
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    ROLE_CHANGED = "role_changed"
    
    # Resource access
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    FILE_DELETED = "file_deleted"
    
    # Security events
    PERMISSION_DENIED = "permission_denied"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    
    # System events
    CONFIGURATION_CHANGE = "configuration_change"
    MAINTENANCE_MODE = "maintenance_mode"
    
    # Custom actions
    CUSTOM = "custom"

class AuditLogEntry(BaseModel):
    """Model for audit log entries."""
    log_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    action: AuditAction
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    status: str = "success"
    details: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the log entry to a dictionary."""
        return self.dict(exclude_none=True)
    
    def to_json(self) -> str:
        """Convert the log entry to a JSON string."""
        return self.json(exclude_none=True)

class AuditLogger:
    """Service for logging audit events."""
    
    @classmethod
    def _get_client_info(cls, request: Request = None) -> Dict[str, str]:
        """Extract client information from the request."""
        if not request:
            return {}
            
        return {
            "user_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "x_forwarded_for": request.headers.get("x-forwarded-for"),
            "x_real_ip": request.headers.get("x-real-ip")
        }
    
    @classmethod
    def _get_user_info(cls, user: Union[TokenPayload, Dict[str, Any], None] = None) -> Dict[str, str]:
        """Extract user information from a user object."""
        if not user:
            return {}
            
        if isinstance(user, TokenPayload):
            return {
                "user_id": user.sub,
                "user_email": getattr(user, "email", None)
            }
        elif isinstance(user, dict):
            return {
                "user_id": user.get("id") or user.get("user_id") or user.get("sub"),
                "user_email": user.get("email") or user.get("user_email")
            }
        return {}
    
    @classmethod
    def log(
        cls,
        action: Union[AuditAction, str],
        user: Union[TokenPayload, Dict[str, Any], None] = None,
        request: Request = None,
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log an audit event.
        
        Args:
            action: The type of action being logged
            user: The user performing the action
            request: The HTTP request object
            resource: The resource being acted upon
            resource_id: The ID of the resource
            status: Status of the action (success/failed)
            details: Additional details about the event
            metadata: Additional metadata for the event
            
        Returns:
            The ID of the log entry
        """
        try:
            # Convert action string to enum if needed
            if isinstance(action, str):
                try:
                    action = AuditAction(action.lower())
                except ValueError:
                    action = AuditAction.CUSTOM
            
            # Create log entry
            entry = AuditLogEntry(
                action=action,
                status=status,
                resource=resource,
                resource_id=str(resource_id) if resource_id is not None else None,
                details=details or {},
                metadata=metadata or {}
            )
            
            # Add user info
            if user:
                user_info = cls._get_user_info(user)
                entry.user_id = user_info.get("user_id")
                entry.user_email = user_info.get("user_email")
            
            # Add client info from request
            if request:
                client_info = cls._get_client_info(request)
                entry.user_ip = client_info.get("user_ip")
                entry.user_agent = client_info.get("user_agent")
                
                # Add request details to metadata
                entry.metadata.update({
                    "method": request.method,
                    "url": str(request.url),
                    "path": request.url.path,
                    "query_params": dict(request.query_params)
                })
            
            # Log the entry
            log_data = entry.dict(exclude_none=True)
            audit_logger.info(
                f"Audit: {action.value} - {status}",
                extra={"audit_data": log_data}
            )
            
            # Also write to JSONL file for easier processing
            with open(LOG_DIR / "audit_log.jsonl", "a") as f:
                f.write(json.dumps(log_data, default=str) + "\n")
            
            return entry.log_id
            
        except Exception as e:
            # Don't let audit logging break the application
            audit_logger.error(f"Failed to log audit event: {str(e)}", exc_info=True)
            return ""
    
    @classmethod
    async def get_logs(
        cls,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        action: Optional[Union[AuditAction, str]] = None,
        user_id: Optional[str] = None,
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieve audit logs matching the specified criteria.
        
        Args:
            start_time: Filter logs after this timestamp
            end_time: Filter logs before this timestamp
            action: Filter by action type
            user_id: Filter by user ID
            resource: Filter by resource type
            resource_id: Filter by resource ID
            status: Filter by status
            limit: Maximum number of logs to return
            offset: Number of logs to skip
            
        Returns:
            Dictionary containing logs and pagination info
        """
        try:
            log_file = LOG_DIR / "audit_log.jsonl"
            
            if not log_file.exists():
                return {
                    "logs": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset
                }
            
            logs = []
            total = 0
            
            # Convert action to string if it's an enum
            action_str = action.value if isinstance(action, AuditAction) else action
            
            with open(log_file, "r") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        
                        # Apply filters
                        if start_time and datetime.fromisoformat(entry["timestamp"]) < start_time:
                            continue
                            
                        if end_time and datetime.fromisoformat(entry["timestamp"]) > end_time:
                            continue
                            
                        if action_str and entry.get("action") != action_str:
                            continue
                            
                        if user_id and entry.get("user_id") != user_id:
                            continue
                            
                        if resource and entry.get("resource") != resource:
                            continue
                            
                        if resource_id and entry.get("resource_id") != resource_id:
                            continue
                            
                        if status and entry.get("status") != status:
                            continue
                        
                        total += 1
                        
                        # Apply pagination
                        if offset > 0 and total <= offset:
                            continue
                            
                        if len(logs) < limit:
                            logs.append(entry)
                        
                    except (json.JSONDecodeError, KeyError) as e:
                        audit_logger.warning(f"Invalid log entry: {str(e)}")
                        continue
            
            return {
                "logs": logs,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            audit_logger.error(f"Failed to retrieve audit logs: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve audit logs"
            )
    
    @classmethod
    async def export_logs(
        cls,
        format: str = "json",
        **filters
    ) -> Dict[str, Any]:
        """
        Export audit logs in the specified format.
        
        Args:
            format: Export format (json, csv)
            **filters: Filters to apply (same as get_logs)
            
        Returns:
            Dictionary containing the exported data and metadata
        """
        try:
            # Get logs with filters
            result = await cls.get_logs(**filters)
            logs = result["logs"]
            
            if format.lower() == "csv":
                import csv
                from io import StringIO
                
                if not logs:
                    return {"data": "", "format": "csv", "count": 0}
                
                # Get all unique field names
                fieldnames = set()
                for log in logs:
                    fieldnames.update(log.keys())
                
                # Convert to CSV
                output = StringIO()
                writer = csv.DictWriter(output, fieldnames=sorted(fieldnames))
                writer.writeheader()
                writer.writerows(logs)
                
                return {
                    "data": output.getvalue(),
                    "format": "csv",
                    "count": len(logs)
                }
                
            else:  # Default to JSON
                return {
                    "data": logs,
                    "format": "json",
                    "count": len(logs)
                }
                
        except Exception as e:
            audit_logger.error(f"Failed to export audit logs: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to export audit logs"
            )

# Global instance
audit_log = AuditLogger()

# Example usage:
# audit_log.log(
#     action=AuditAction.LOGIN,
#     user=current_user,
#     request=request,
#     status="success",
#     details={"method": "password"}
# )
