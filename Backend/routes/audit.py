"""
Audit Log API Endpoints

This module provides REST API endpoints for accessing and managing audit logs.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
import json
import csv
from io import StringIO

from core.security.jwt import JWTBearer, requires_admin
from services.audit.audit_logger import AuditAction, AuditLogger, audit_log
from pydantic import BaseModel, Field, validator
from typing import Optional

router = APIRouter(
    prefix="/api/v1/audit",
    tags=["audit"],
    dependencies=[Depends(JWTBearer())],
    responses={404: {"description": "Not found"}},
)

class AuditLogFilter(BaseModel):
    """Filter criteria for querying audit logs."""
    start_time: Optional[datetime] = Field(
        None,
        description="Filter logs after this timestamp"
    )
    end_time: Optional[datetime] = Field(
        None,
        description="Filter logs before this timestamp"
    )
    action: Optional[str] = Field(
        None,
        description="Filter by action type"
    )
    user_id: Optional[str] = Field(
        None,
        description="Filter by user ID"
    )
    resource: Optional[str] = Field(
        None,
        description="Filter by resource type"
    )
    resource_id: Optional[str] = Field(
        None,
        description="Filter by resource ID"
    )
    status: Optional[str] = Field(
        None,
        description="Filter by status (success/failed)"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "start_time": "2023-01-01T00:00:00Z",
                "end_time": "2023-12-31T23:59:59Z",
                "action": "login",
                "user_id": "user_123",
                "status": "success"
            }
        }

class AuditLogResponse(BaseModel):
    """Response model for audit log entries."""
    logs: List[Dict[str, Any]] = Field(..., description="List of audit log entries")
    total: int = Field(..., description="Total number of matching entries")
    limit: int = Field(..., description="Maximum number of entries returned")
    offset: int = Field(..., description="Number of entries skipped")

@router.get(
    "/logs",
    response_model=AuditLogResponse,
    summary="Get audit logs",
    description="Retrieve audit logs with filtering and pagination.",
    dependencies=[Depends(requires_admin)]
)
async def get_audit_logs(
    request: Request,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=1000, description="Maximum number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip")
):
    """
    Retrieve audit logs with filtering and pagination.
    
    This endpoint allows administrators to query the audit logs with various
    filters to track user activities and system events.
    """
    try:
        # Log the audit log access
        current_user = request.state.user
        audit_log.log(
            action=AuditAction.RESOURCE_ACCESS,
            user=current_user,
            request=request,
            resource="audit_log",
            status="success",
            details={"action": "view_logs"}
        )
        
        # Get logs with filters
        logs = await audit_log.get_logs(
            start_time=start_time,
            end_time=end_time,
            action=action,
            user_id=user_id,
            resource=resource,
            resource_id=resource_id,
            status=status,
            limit=limit,
            offset=offset
        )
        
        return logs
        
    except Exception as e:
        audit_log.log(
            action=AuditAction.RESOURCE_ACCESS,
            user=getattr(request.state, 'user', None),
            request=request,
            resource="audit_log",
            status="failed",
            details={"error": str(e), "action": "view_logs"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit logs"
        )

@router.get(
    "/export",
    summary="Export audit logs",
    description="Export audit logs in the specified format (JSON or CSV).",
    dependencies=[Depends(requires_admin)]
)
async def export_audit_logs(
    request: Request,
    format: str = Query("json", regex="^(json|csv)$", description="Export format"),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Export audit logs in the specified format (JSON or CSV).
    
    This endpoint allows administrators to export audit logs for external
    analysis or archiving purposes.
    """
    try:
        # Log the export action
        current_user = request.state.user
        audit_log.log(
            action=AuditAction.RESOURCE_EXPORT,
            user=current_user,
            request=request,
            resource="audit_log",
            status="success",
            details={"format": format}
        )
        
        # Export logs with filters
        result = await audit_log.export_logs(
            format=format,
            start_time=start_time,
            end_time=end_time,
            action=action,
            user_id=user_id,
            resource=resource,
            resource_id=resource_id,
            status=status
        )
        
        if format.lower() == "csv":
            return Response(
                content=result["data"],
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        else:
            return JSONResponse(
                content=result,
                headers={
                    "Content-Disposition": f"attachment; filename=audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        audit_log.log(
            action=AuditAction.RESOURCE_EXPORT,
            user=getattr(request.state, 'user', None),
            request=request,
            resource="audit_log",
            status="failed",
            details={"error": str(e), "format": format}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export audit logs"
        )

@router.get(
    "/actions",
    response_model=List[Dict[str, Any]],
    summary="Get available audit actions",
    description="Retrieve a list of all available audit action types.",
    dependencies=[Depends(JWTBearer())]
)
async def get_audit_actions():
    """
    Retrieve a list of all available audit action types.
    
    This endpoint returns the complete list of audit action types that
    can be used for filtering audit logs.
    """
    try:
        return [
            {"value": action.value, "label": action.name.replace("_", " ").title()}
            for action in AuditAction
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit actions"
        )

@router.get(
    "/stats",
    summary="Get audit statistics",
    description="Retrieve statistics about audit events.",
    dependencies=[Depends(requires_admin)]
)
async def get_audit_statistics(
    request: Request,
    time_range: str = Query("7d", description="Time range for statistics (e.g., 24h, 7d, 30d)")
):
    """
    Retrieve statistics about audit events.
    
    This endpoint provides aggregated statistics about audit events,
    such as event counts by type, user, and time period.
    """
    try:
        # Parse time range
        now = datetime.utcnow()
        if time_range.endswith("h"):
            hours = int(time_range[:-1])
            start_time = now - timedelta(hours=hours)
            time_unit = "hour"
        elif time_range.endswith("d"):
            days = int(time_range[:-1])
            start_time = now - timedelta(days=days)
            time_unit = "day"
        else:
            raise ValueError("Invalid time range format. Use '24h' or '7d' format.")
        
        # Get logs for the time range
        logs = await audit_log.get_logs(
            start_time=start_time,
            end_time=now,
            limit=10000  # Adjust based on expected volume
        )
        
        # Calculate statistics
        stats = {
            "total_events": logs["total"],
            "time_range": {
                "start": start_time.isoformat(),
                "end": now.isoformat(),
                "unit": time_unit
            },
            "by_action": {},
            "by_status": {},
            "by_user": {},
            "by_resource": {},
            "timeline": {}
        }
        
        # Aggregate data
        for log in logs["logs"]:
            # By action
            action = log.get("action", "unknown")
            stats["by_action"][action] = stats["by_action"].get(action, 0) + 1
            
            # By status
            status = log.get("status", "unknown")
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
            
            # By user
            user_id = log.get("user_id", "anonymous")
            if user_id not in stats["by_user"]:
                stats["by_user"][user_id] = {
                    "count": 0,
                    "email": log.get("user_email", "unknown")
                }
            stats["by_user"][user_id]["count"] += 1
            
            # By resource
            resource = log.get("resource", "none")
            stats["by_resource"][resource] = stats["by_resource"].get(resource, 0) + 1
            
            # Timeline (group by hour or day)
            try:
                timestamp = datetime.fromisoformat(log["timestamp"])
                if time_unit == "hour":
                    time_key = timestamp.strftime("%Y-%m-%d %H:00")
                else:  # day
                    time_key = timestamp.strftime("%Y-%m-%d")
                
                if time_key not in stats["timeline"]:
                    stats["timeline"][time_key] = 0
                stats["timeline"][time_key] += 1
            except (KeyError, ValueError):
                pass
        
        # Sort and format results
        stats["by_action"] = [
            {"action": k, "count": v}
            for k, v in sorted(stats["by_action"].items(), key=lambda x: x[1], reverse=True)
        ]
        
        stats["by_status"] = [
            {"status": k, "count": v}
            for k, v in sorted(stats["by_status"].items(), key=lambda x: x[1], reverse=True)
        ]
        
        stats["by_user"] = [
            {"user_id": k, "email": v["email"], "count": v["count"]}
            for k, v in sorted(stats["by_user"].items(), key=lambda x: x[1]["count"], reverse=True)
        ]
        
        stats["by_resource"] = [
            {"resource": k, "count": v}
            for k, v in sorted(stats["by_resource"].items(), key=lambda x: x[1], reverse=True)
        ]
        
        stats["timeline"] = [
            {"time": k, "count": v}
            for k, v in sorted(stats["timeline"].items())
        ]
        
        return stats
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        audit_log.log(
            action=AuditAction.RESOURCE_ACCESS,
            user=getattr(request.state, 'user', None),
            request=request,
            resource="audit_stats",
            status="failed",
            details={"error": str(e)}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate audit statistics"
        )
