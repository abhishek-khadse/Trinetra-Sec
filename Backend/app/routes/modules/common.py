"""
Common routes for scan results and threat feeds.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from pydantic import BaseModel, Field

from config import settings
from core.database import get_db, ScanResult, ThreatFeedItem, Report, User
from core.utils.logger import logger as log
from auth.services.user_service import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Common"])

# Response Models
class ScanResultResponse(BaseModel):
    """Scan result response model."""
    id: str
    scan_type: str
    target: str
    status: str
    risk_score: Optional[float] = None
    threat_level: Optional[str] = None
    model_used: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class ThreatFeedItemResponse(BaseModel):
    """Threat feed item response model."""
    id: str
    title: str
    description: str
    threat_type: str
    severity: str
    source: str
    iocs: dict
    created_at: datetime
    
    class Config:
        orm_mode = True

class ReportResponse(BaseModel):
    """Report response model."""
    id: str
    scan_id: str
    report_type: str
    file_size: int
    download_count: int
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.get(
    "/scans/recent",
    response_model=List[ScanResultResponse],
    summary="Get recent scan results"
)
async def get_recent_scans(
    limit: int = Query(10, ge=1, le=100, description="Number of results to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the most recent scan results for the current user.
    
    - **limit**: Maximum number of results to return (1-100)
    """
    try:
        # Get user's recent scans
        result = await db.execute(
            select(ScanResult)
            .where(ScanResult.user_id == current_user.id)
            .order_by(desc(ScanResult.created_at))
            .limit(limit)
        )
        
        scans = result.scalars().all()
        return scans
        
    except Exception as e:
        log.error(f"Error retrieving scan results: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving scan results"
        )

@router.get(
    "/threats/recent",
    response_model=List[ThreatFeedItemResponse],
    summary="Get recent threat feed items"
)
async def get_recent_threats(
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    threat_type: Optional[str] = Query(None, description="Filter by threat type"),
    days: int = Query(30, ge=1, le=365, description="Max age of threats in days"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve recent threat feed items.
    
    - **limit**: Maximum number of results to return (1-100)
    - **severity**: Filter by severity level (e.g., 'high', 'medium', 'low')
    - **threat_type**: Filter by threat type (e.g., 'malware', 'phishing')
    - **days**: Maximum age of threats to include (1-365 days)
    """
    try:
        # Calculate date threshold
        threshold = datetime.utcnow() - timedelta(days=days)
        
        # Build query
        query = select(ThreatFeedItem).where(
            ThreatFeedItem.created_at >= threshold
        )
        
        # Apply filters
        if severity:
            query = query.where(ThreatFeedItem.severity == severity.lower())
        if threat_type:
            query = query.where(ThreatFeedItem.threat_type == threat_type.lower())
        
        # Execute query
        result = await db.execute(
            query.order_by(desc(ThreatFeedItem.created_at)).limit(limit)
        )
        
        threats = result.scalars().all()
        return threats
        
    except Exception as e:
        log.error(f"Error retrieving threat feed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving threat feed"
        )

@router.get(
    "/reports/user",
    response_model=List[ReportResponse],
    summary="Get user's reports"
)
async def get_user_reports(
    limit: int = Query(10, ge=1, le=100, description="Number of results to return"),
    report_type: Optional[str] = Query(None, description="Filter by report type (pdf, json)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve reports for the current user's scans.
    
    - **limit**: Maximum number of results to return (1-100)
    - **report_type**: Filter by report type (pdf, json)
    """
    try:
        # Build query
        query = select(Report).join(
            ScanResult,
            Report.scan_id == ScanResult.id
        ).where(
            ScanResult.user_id == current_user.id
        )
        
        # Apply filters
        if report_type:
            query = query.where(Report.report_type == report_type.lower())
        
        # Execute query
        result = await db.execute(
            query.order_by(desc(Report.created_at)).limit(limit)
        )
        
        reports = result.scalars().all()
        return reports
        
    except Exception as e:
        log.error(f"Error retrieving user reports: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving reports"
        )

@router.get(
    "/reports/{report_id}",
    response_model=ReportResponse,
    summary="Get report details"
)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details for a specific report.
    
    - **report_id**: ID of the report to retrieve
    """
    try:
        # Get report with scan verification
        result = await db.execute(
            select(Report)
            .join(ScanResult, Report.scan_id == ScanResult.id)
            .where(and_(
                Report.id == report_id,
                ScanResult.user_id == current_user.id
            ))
        )
        
        report = result.scalars().first()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or access denied"
            )
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error retrieving report {report_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the report"
        )

@router.get(
    "/reports/{report_id}/download",
    summary="Download a report"
)
async def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Download a report file if the user has access.
    
    - **report_id**: ID of the report to download
    """
    try:
        # Get report with scan verification
        result = await db.execute(
            select(Report)
            .join(ScanResult, Report.scan_id == ScanResult.id)
            .where(and_(
                Report.id == report_id,
                ScanResult.user_id == current_user.id
            ))
        )
        
        report = result.scalars().first()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or access denied"
            )
        
        # Verify file exists
        import os
        if not os.path.exists(report.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report file not found"
            )
        
        # Determine content type
        content_type = "application/pdf"
        if report.report_type.lower() == "json":
            content_type = "application/json"
        
        # Increment download count
        report.download_count += 1
        await db.commit()
        
        # Return file
        from fastapi.responses import FileResponse
        return FileResponse(
            report.file_path,
            media_type=content_type,
            filename=f"report_{report.id}.{report.report_type}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error downloading report {report_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while downloading the report"
        )
