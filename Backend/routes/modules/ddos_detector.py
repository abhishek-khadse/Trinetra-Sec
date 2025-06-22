from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, validator, HttpUrl
from datetime import datetime, timedelta
import logging
import json

from core.engine.analyzer import analyzer
from core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ddos", tags=["ddos"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class DDoSAttackPattern(BaseModel):
    """Model representing a DDoS attack pattern."""
    source_ips: List[str] = Field(..., description="List of source IP addresses")
    request_rate: float = Field(..., description="Requests per second")
    protocol: str = Field(..., description="Network protocol used in attack")
    pattern_type: str = Field(..., description="Type of DDoS pattern detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of detection")

class DDoSDetectionRequest(BaseModel):
    """Request model for DDoS detection."""
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the traffic data")
    traffic_data: Dict[str, Any] = Field(..., description="Network traffic data for analysis")
    time_window_seconds: int = Field(60, description="Time window in seconds for analysis")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class DDoSDetectionResponse(BaseModel):
    """Response model for DDoS detection."""
    scan_id: str = Field(..., description="Unique scan identifier")
    status: str = Field(..., description="Scan status")
    timestamp: str = Field(..., description="ISO format timestamp")
    is_detected: bool = Field(..., description="Whether DDoS attack was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of detection")
    attack_type: Optional[str] = Field(None, description="Type of DDoS attack detected")
    attack_patterns: List[DDoSAttackPattern] = Field(default_factory=list, description="Detected attack patterns")
    mitigation_recommendations: List[str] = Field(default_factory=list, description="Recommended mitigation actions")

@router.post(
    "/detect",
    response_model=DDoSDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect DDoS attacks",
    description="Analyze network traffic for potential DDoS attacks."
)
async def detect_ddos(
    request: DDoSDetectionRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Detect potential DDoS attacks in network traffic.
    
    This endpoint analyzes network traffic patterns to identify potential
    Distributed Denial of Service (DDoS) attacks, including volumetric,
    protocol, and application layer attacks.
    """
    try:
        # Validate input
        if not request.traffic_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Traffic data is required"
            )
        
        # Convert Pydantic model to dict for the analyzer
        input_data = request.dict(exclude_none=True)
        
        # Perform the analysis
        result = analyzer.analyze(input_data, scan_type="ddos")
        
        # Format the response
        return DDoSDetectionResponse(
            scan_id=result["scan_id"],
            status=result["status"],
            timestamp=result["timestamp"],
            is_detected=result["result"].get("is_detected", False),
            confidence=result["result"].get("confidence", 0.0),
            attack_type=result["result"].get("attack_type"),
            attack_patterns=result["result"].get("attack_patterns", []),
            mitigation_recommendations=result["result"].get("mitigation_recommendations", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DDoS detection failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DDoS detection failed: {str(e)}"
        )

class DDoSMitigationRequest(BaseModel):
    """Request model for DDoS mitigation actions."""
    action: str = Field(..., description="Mitigation action to take")
    target: Union[str, List[str]] = Field(..., description="Target of the mitigation (IP, subnet, etc.)")
    duration_seconds: int = Field(300, description="Duration of the mitigation in seconds")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Additional parameters for the mitigation")

@router.post(
    "/mitigate",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Mitigate DDoS attack",
    description="Initiate DDoS mitigation actions."
)
async def mitigate_ddos(
    request: DDoSMitigationRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Initiate DDoS mitigation actions.
    
    This endpoint triggers mitigation actions against detected DDoS attacks,
    such as rate limiting, IP blocking, or traffic redirection.
    """
    try:
        # In a real implementation, this would trigger actual mitigation actions
        # For now, just log the request and return a success response
        logger.info(f"DDoS mitigation requested: {request.dict()}")
        
        return {
            "status": "mitigation_started",
            "message": f"Mitigation action '{request.action}' initiated for target(s)",
            "target": request.target,
            "duration_seconds": request.duration_seconds,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"DDoS mitigation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DDoS mitigation failed: {str(e)}"
        )

class DDoSMetrics(BaseModel):
    """Model for DDoS detection metrics."""
    timestamp: datetime
    request_rate: float
    attack_confidence: float
    attack_type: Optional[str]
    source_ips: List[str]

@router.get(
    "/metrics",
    response_model=List[DDoSMetrics],
    status_code=status.HTTP_200_OK,
    summary="Get DDoS detection metrics",
    description="Retrieve historical DDoS detection metrics."
)
async def get_ddos_metrics(
    start_time: datetime = Field(..., description="Start time for metrics query"),
    end_time: datetime = Field(..., description="End time for metrics query"),
    interval_seconds: int = Field(300, description="Time interval in seconds for aggregating metrics"),
    token: str = Depends(oauth2_scheme)
):
    """
    Retrieve historical DDoS detection metrics.
    
    This endpoint returns time-series data of DDoS detection metrics
    for monitoring and analysis purposes.
    """
    try:
        # In a real implementation, you would query a time-series database
        # For now, return mock data
        metrics = []
        current_time = start_time
        
        while current_time < end_time:
            metrics.append({
                "timestamp": current_time,
                "request_rate": 1000 + (hash(str(current_time)) % 5000),  # Random-ish values
                "attack_confidence": (hash(str(current_time)) % 100) / 100.0,  # 0.0-1.0
                "attack_type": "volumetric" if hash(str(current_time)) % 10 > 7 else None,
                "source_ips": [f"192.168.1.{i}" for i in range(1, 6)]
            })
            current_time += timedelta(seconds=interval_seconds)
        
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to retrieve DDoS metrics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve DDoS metrics"
        )
