from fastapi import APIRouter, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime, timedelta
import random

router = APIRouter()

class DashboardStats(BaseModel):
    total_scans: int
    threats_detected: int
    high_risk_items: int
    recent_activity: List[Dict[str, str]]
    threat_distribution: Dict[str, int]
    last_updated: datetime

@router.get("/stats", response_model=DashboardStats, tags=["dashboard"])
async def get_dashboard_stats(Authorize: AuthJWT = Depends()):
    try:
        Authorize.jwt_required()
        
        # Generate sample data for demonstration
        threat_types = ["Malware", "Phishing", "DDoS", "Data Exfiltration", "Insider Threat"]
        threat_distribution = {threat: random.randint(1, 100) for threat in threat_types}
        
        recent_activity = [
            {"type": "scan", "description": "Completed malware scan on uploads/", "timestamp": (datetime.now() - timedelta(minutes=i*30)).isoformat()}
            for i in range(5)
        ]
        
        return {
            "total_scans": random.randint(100, 1000),
            "threats_detected": random.randint(10, 100),
            "high_risk_items": random.randint(1, 20),
            "recent_activity": recent_activity,
            "threat_distribution": threat_distribution,
            "last_updated": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
