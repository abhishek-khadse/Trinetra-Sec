from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, HttpUrl, validator
from datetime import datetime
import logging
import re
from urllib.parse import urlparse

from core.engine.analyzer import analyzer
from core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/phishing", tags=["phishing"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class PhishingDetectionRequest(BaseModel):
    """Request model for phishing detection."""
    url: Optional[HttpUrl] = Field(None, description="URL to check for phishing")
    html_content: Optional[str] = Field(None, description="HTML content to analyze")
    text_content: Optional[str] = Field(None, description="Plain text content to analyze")
    headers: Optional[Dict[str, str]] = Field(None, description="HTTP headers from the request")
    screenshot_url: Optional[str] = Field(None, description="URL to a screenshot of the page")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class PhishingIndicator(BaseModel):
    """Model representing a phishing indicator."""
    type: str = Field(..., description="Type of indicator")
    value: str = Field(..., description="The indicator value")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    description: Optional[str] = Field(None, description="Description of the indicator")

class PhishingDetectionResponse(BaseModel):
    """Response model for phishing detection."""
    scan_id: str = Field(..., description="Unique scan identifier")
    status: str = Field(..., description="Scan status")
    timestamp: str = Field(..., description="ISO format timestamp")
    is_phishing: bool = Field(..., description="Whether phishing was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of detection")
    indicators: List[PhishingIndicator] = Field(default_factory=list, description="Detected phishing indicators")
    risk_level: str = Field(..., description="Risk level (low, medium, high, critical)")
    explanation: Optional[str] = Field(None, description="Explanation of the detection")

@router.post(
    "/detect",
    response_model=PhishingDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect phishing attempts",
    description="Analyze URLs or content for potential phishing attempts."
)
async def detect_phishing(
    request: PhishingDetectionRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Detect potential phishing attempts in URLs or content.
    
    This endpoint analyzes URLs, HTML content, or plain text for indicators
    of phishing attempts, including suspicious domains, deceptive content,
    and known phishing patterns.
    """
    try:
        # Validate input
        if not any([request.url, request.html_content, request.text_content]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one of 'url', 'html_content', or 'text_content' must be provided"
            )
        
        # Extract domain for logging
        domain = str(request.url.hostname) if request.url else "content-based"
        logger.info(f"Phishing detection requested for: {domain}")
        
        # Convert Pydantic model to dict for the analyzer
        input_data = request.dict(exclude_none=True)
        
        # Perform the analysis
        result = analyzer.analyze(input_data, scan_type="phishing")
        
        # Format the response
        return PhishingDetectionResponse(
            scan_id=result["scan_id"],
            status=result["status"],
            timestamp=result["timestamp"],
            is_phishing=result["result"].get("is_phishing", False),
            confidence=result["result"].get("confidence", 0.0),
            risk_level=result["result"].get("risk_level", "low"),
            indicators=result["result"].get("indicators", []),
            explanation=result["result"].get("explanation")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Phishing detection failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Phishing detection failed: {str(e)}"
        )

class PhishingCheckRequest(BaseModel):
    """Request model for quick phishing check."""
    url: HttpUrl = Field(..., description="URL to check for phishing")

class PhishingCheckResponse(BaseModel):
    """Response model for quick phishing check."""
    url: str = Field(..., description="The URL that was checked")
    is_phishing: bool = Field(..., description="Whether phishing was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    risk_level: str = Field(..., description="Risk level (low, medium, high, critical)")
    timestamp: str = Field(..., description="ISO format timestamp")

@router.post(
    "/check",
    response_model=PhishingCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Quick phishing check",
    description="Perform a quick check if a URL is potentially phishing."
)
async def check_phishing(
    request: PhishingCheckRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Perform a quick check if a URL is potentially phishing.
    
    This lightweight endpoint provides a quick assessment of whether a URL
    appears to be a phishing attempt, suitable for real-time checks.
    """
    try:
        # In a real implementation, this would use a faster, less thorough check
        # For now, we'll just call the main detection with minimal data
        input_data = {"url": str(request.url)}
        result = analyzer.analyze(input_data, scan_type="phishing_quick")
        
        return PhishingCheckResponse(
            url=str(request.url),
            is_phishing=result["result"].get("is_phishing", False),
            confidence=result["result"].get("confidence", 0.0),
            risk_level=result["result"].get("risk_level", "low"),
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Quick phishing check failed: {str(e)}", exc_info=True)
        # For quick checks, return a safe default on error
        return {
            "url": str(request.url),
            "is_phishing": False,
            "confidence": 0.0,
            "risk_level": "unknown",
            "timestamp": datetime.utcnow().isoformat()
        }

class PhishingStats(BaseModel):
    """Model for phishing detection statistics."""
    total_scans: int
    phishing_detected: int
    false_positives: int
    detection_rate: float
    top_domains: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    last_updated: str

@router.get(
    "/stats",
    response_model=PhishingStats,
    status_code=status.HTTP_200_OK,
    summary="Get phishing detection statistics",
    description="Retrieve statistics about phishing detections."
)
async def get_phishing_stats(
    token: str = Depends(oauth2_scheme)
):
    """
    Retrieve statistics about phishing detections.
    
    This endpoint returns aggregated statistics about phishing detections,
    including detection rates, common indicators, and performance metrics.
    """
    try:
        # In a real implementation, you would query a database for these stats
        # For now, return mock data
        return {
            "total_scans": 1245,
            "phishing_detected": 342,
            "false_positives": 12,
            "detection_rate": 0.95,
            "top_domains": [
                {"domain": "paypal.com", "count": 45, "is_legitimate": True},
                {"domain": "appleid.apple.com", "count": 32, "is_legitimate": True},
                {"domain": "secure-login.net", "count": 28, "is_legitimate": False},
                {"domain": "microsoft-verify.com", "count": 22, "is_legitimate": True},
                {"domain": "account-update.info", "count": 18, "is_legitimate": False}
            ],
            "risk_distribution": {
                "critical": 45,
                "high": 128,
                "medium": 98,
                "low": 71,
                "info": 0
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve phishing stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve phishing statistics"
        )
