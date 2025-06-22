# routes/dashboard/stats.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from core.database import get_db
from auth.services.user_service import get_current_user
from core.database.models import User, ScanResult

router = APIRouter()

@router.get("/stats", summary="Get Dashboard Statistics")
async def get_dashboard_stats(
    admin_mode: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve aggregated statistics for the dashboard.

    - **admin_mode**: If true, returns global statistics (requires admin privileges).
    - By default, returns stats for the current user.
    """
    if admin_mode and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required for global stats"
        )

    # Base query for scans
    query = select(ScanResult)
    if not admin_mode:
        query = query.where(ScanResult.user_id == current_user.id)

    # 1. Total scans
    total_scans_query = select(func.count()).select_from(query.alias())
    total_scans = (await db.execute(total_scans_query)).scalar_one_or_none() or 0

    # 2. High-risk findings
    high_risk_query = select(func.count()).select_from(
        query.where(ScanResult.risk_score >= 0.7).alias()
    )
    high_risk_findings = (await db.execute(high_risk_query)).scalar_one_or_none() or 0

    # 3. Most used model
    most_used_model_query = (
        select(ScanResult.model_used, func.count(ScanResult.model_used).label("count"))
        .select_from(query.alias())
        .group_by(ScanResult.model_used)
        .order_by(func.count(ScanResult.model_used).desc())
        .limit(1)
    )
    most_used_model_result = (await db.execute(most_used_model_query)).first()
    most_used_model = most_used_model_result[0] if most_used_model_result else "N/A"

    # 4. Scan count by day (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    scan_trends_query = (
        select(
            func.date(ScanResult.created_at).label("date"),
            func.count(ScanResult.id).label("count")
        )
        .select_from(query.where(ScanResult.created_at >= seven_days_ago).alias())
        .group_by(func.date(ScanResult.created_at))
        .order_by(func.date(ScanResult.created_at))
    )
    scan_trends_result = (await db.execute(scan_trends_query)).all()
    scan_trends = {str(date): count for date, count in scan_trends_result}

    # 5. User's top 3 scans (only for user mode)
    top_scans = []
    if not admin_mode:
        top_scans_query = (
            select(ScanResult)
            .where(ScanResult.user_id == current_user.id)
            .order_by(ScanResult.risk_score.desc())
            .limit(3)
        )
        top_scans_result = (await db.execute(top_scans_query)).scalars().all()
        top_scans = [scan.to_dict() for scan in top_scans_result] # Assumes to_dict() method

    return {
        "total_scans": total_scans,
        "high_risk_findings": high_risk_findings,
        "most_used_model": most_used_model,
        "scan_trends": scan_trends,
        "top_scans": top_scans,
    }
