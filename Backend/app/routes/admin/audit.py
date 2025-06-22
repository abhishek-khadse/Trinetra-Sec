"""
Audit log routes for administrative access.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from pydantic import BaseModel, Field
import json

from config import settings
from core.database import get_db, AuditLog, AuditAction, User
from core.utils.logger import logger as log
from auth.services.user_service import get_current_user

router = APIRouter(prefix="/api/v1/admin/audit", tags=["Admin - Audit"])

# Role-based access control - only admin users can access these endpoints
admin_required = Depends(lambda: get_current_user(required_roles=["admin"]))

class AuditLogFilter(BaseModel):
    """Filter criteria for audit logs."""
    action: Optional[AuditAction] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    user_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    ip_address: Optional[str] = None

class AuditLogResponse(BaseModel):
    """Audit log response model."""
    id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    user_id: Optional[str]
    user_email: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    details: dict
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.get(
    "/logs",
    response_model=List[AuditLogResponse],
    summary="Get audit logs"
)
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[AuditAction] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    ip_address: Optional[str] = None,
    current_user: User = admin_required,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve audit logs with filtering and pagination.
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return (max 1000)
    - **action**: Filter by action type
    - **resource_type**: Filter by resource type
    - **resource_id**: Filter by resource ID
    - **user_id**: Filter by user ID
    - **start_date**: Filter logs after this timestamp
    - **end_date**: Filter logs before this timestamp
    - **ip_address**: Filter by IP address
    """
    try:
        # Build query
        query = select(AuditLog).order_by(AuditLog.created_at.desc())
        
        # Apply filters
        conditions = []
        
        if action:
            conditions.append(AuditLog.action == action)
        if resource_type:
            conditions.append(AuditLog.resource_type == resource_type)
        if resource_id:
            conditions.append(AuditLog.resource_id == resource_id)
        if user_id:
            conditions.append(AuditLog.user_id == user_id)
        if ip_address:
            conditions.append(AuditLog.ip_address == ip_address)
        if start_date:
            conditions.append(AuditLog.created_at >= start_date)
        if end_date:
            # Include the entire end date
            end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            conditions.append(AuditLog.created_at <= end_date)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Get user emails for the logs
        user_emails = {}
        if logs:
            user_ids = {log.user_id for log in logs if log.user_id}
            if user_ids:
                users = await db.execute(
                    select(User.id, User.email).where(User.id.in_(user_ids))
                )
                user_emails = {str(user.id): user.email for user in users}
        
        # Format response
        response = []
        for log in logs:
            response.append({
                "id": str(log.id),
                "action": log.action.value,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "user_id": str(log.user_id) if log.user_id else None,
                "user_email": user_emails.get(str(log.user_id)) if log.user_id else None,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "details": log.details,
                "created_at": log.created_at
            })
        
        return response
        
    except Exception as e:
        log.error(f"Error retrieving audit logs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving audit logs"
        )

@router.get(
    "/export",
    summary="Export audit logs"
)
async def export_audit_logs(
    format: str = Query("json", regex="^(json|ndjson)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = admin_required,
    db: AsyncSession = Depends(get_db)
):
    """
    Export audit logs in JSON or NDJSON format.
    
    - **format**: Export format (json or ndjson)
    - **start_date**: Filter logs after this timestamp
    - **end_date**: Filter logs before this timestamp
    """
    try:
        # Build query
        query = select(AuditLog).order_by(AuditLog.created_at.asc())
        
        # Apply date filters
        conditions = []
        if start_date:
            conditions.append(AuditLog.created_at >= start_date)
        if end_date:
            end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            conditions.append(AuditLog.created_at <= end_date)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Get user emails for the logs
        user_emails = {}
        if logs:
            user_ids = {log.user_id for log in logs if log.user_id}
            if user_ids:
                users = await db.execute(
                    select(User.id, User.email).where(User.id.in_(user_ids))
                )
                user_emails = {str(user.id): user.email for user in users}
        
        # Format logs
        formatted_logs = []
        for log in logs:
            formatted_log = {
                "id": str(log.id),
                "action": log.action.value,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "user_id": str(log.user_id) if log.user_id else None,
                "user_email": user_emails.get(str(log.user_id)) if log.user_id else None,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "details": log.details,
                "created_at": log.created_at.isoformat()
            }
            formatted_logs.append(formatted_log)
        
        # Return in requested format
        if format == "ndjson":
            # Return as newline-delimited JSON
            content = "\n".join(json.dumps(log) for log in formatted_logs)
            media_type = "application/x-ndjson"
            filename = f"audit_logs_{datetime.utcnow().date()}.ndjson"
        else:
            # Return as pretty-printed JSON array
            content = json.dumps(formatted_logs, indent=2, ensure_ascii=False)
            media_type = "application/json"
            filename = f"audit_logs_{datetime.utcnow().date()}.json"
        
        # Create streaming response
        response = StreamingResponse(
            iter([content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
        return response
        
    except Exception as e:
        log.error(f"Error exporting audit logs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while exporting audit logs"
        )

@router.get(
    "/actions",
    response_model=List[str],
    summary="Get available audit actions"
)
async def get_audit_actions(
    current_user: User = admin_required
):
    """
    Get a list of all available audit actions.
    """
    return [action.value for action in AuditAction]

@router.get(
    "/resource-types",
    response_model=List[str],
    summary="Get audited resource types"
)
async def get_audit_resource_types(
    current_user: User = admin_required,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a list of all resource types that have audit logs.
    """
    try:
        result = await db.execute(
            select(AuditLog.resource_type).distinct().where(AuditLog.resource_type.isnot(None))
        )
        return [row[0] for row in result.all() if row[0]]
    except Exception as e:
        log.error(f"Error getting resource types: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving resource types"
        )
