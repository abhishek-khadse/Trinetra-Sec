from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from core.engine.analyzer import analyzer
from core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/network", tags=["network"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class NetworkAnalysisRequest(BaseModel):
    """Request model for network analysis."""
    protocol: str = Field(..., description="Network protocol (e.g., tcp, udp, http)")
    source_ip: str = Field(..., description="Source IP address")
    destination_ip: str = Field(..., description="Destination IP address")
    port: int = Field(..., description="Destination port number")
    payload: Optional[Dict[str, Any]] = Field(None, description="Optional payload data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the network event")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class NetworkAnalysisResponse(BaseModel):
    """Response model for network analysis."""
    scan_id: str = Field(..., description="Unique scan identifier")
    status: str = Field(..., description="Scan status")
    timestamp: str = Field(..., description="ISO format timestamp")
    scan_type: str = Field(..., description="Type of scan performed")
    result: Dict[str, Any] = Field(..., description="Analysis results")

@router.post(
    "/analyze",
    response_model=NetworkAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze network traffic",
    description="Analyze network traffic for potential security threats."
)
async def analyze_network(
    request: NetworkAnalysisRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Analyze network traffic for potential security threats.
    
    This endpoint accepts network traffic data and returns an analysis of potential
    security threats, including risk scores and detected anomalies.
    """
    try:
        # In a real implementation, you would validate the JWT token here
        # For now, we'll just log it
        logger.debug(f"Received network analysis request with token: {token[:10]}...")
        
        # Convert Pydantic model to dict for the analyzer
        input_data = request.dict()
        
        # Perform the analysis
        result = analyzer.analyze(input_data, scan_type="network")
        
        return NetworkAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Network analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network analysis failed: {str(e)}"
        )

@router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
    summary="Get network stats",
    description="Get statistics about network scans and detections."
)
async def get_network_stats(
    token: str = Depends(oauth2_scheme)
):
    """
    Get statistics about network scans and detections.
    
    Returns aggregated statistics about network scans, including counts
    of different threat levels and recent detections.
    """
    try:
        # In a real implementation, you would query a database for these stats
        # For now, return mock data
        return {
            "total_scans": 42,
            "threat_levels": {
                "high": 5,
                "medium": 12,
                "low": 20,
                "info": 5
            },
            "top_detections": [
                {"type": "Port Scan", "count": 15},
                {"type": "DDoS Attempt", "count": 8},
                {"type": "Suspicious Payload", "count": 6}
            ],
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get network stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve network statistics"
        )
