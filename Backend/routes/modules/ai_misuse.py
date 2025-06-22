from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, validator, HttpUrl
from datetime import datetime, timedelta
import logging
import re
import json

from core.engine.analyzer import analyzer
from core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/misuse", tags=["ai"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AIMisuseRequest(BaseModel):
    """Request model for AI misuse detection."""
    prompt: str = Field(..., description="The prompt or input text to analyze")
    model: Optional[str] = Field(None, description="AI model name or identifier")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the request")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    @validator('prompt')
    def validate_prompt_length(cls, v):
        if len(v) < 3:
            raise ValueError("Prompt must be at least 3 characters long")
        if len(v) > 10000:
            raise ValueError("Prompt must be less than 10,000 characters")
        return v

class AIMisuseResponse(BaseModel):
    """Response model for AI misuse detection."""
    scan_id: str = Field(..., description="Unique scan identifier")
    status: str = Field(..., description="Scan status")
    timestamp: str = Field(..., description="ISO format timestamp")
    is_misuse: bool = Field(..., description="Whether misuse was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of detection")
    risk_level: str = Field(..., description="Risk level (low, medium, high, critical)")
    categories: List[Dict[str, Any]] = Field(default_factory=list, description="Detected misuse categories")
    explanation: Optional[str] = Field(None, description="Explanation of the detection")
    recommendations: List[str] = Field(default_factory=list, description="Recommended actions")

@router.post(
    "/detect",
    response_model=AIMisuseResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect AI misuse",
    description="Analyze AI prompts or outputs for potential misuse."
)
async def detect_ai_misuse(
    request: AIMisuseRequest,
    token: str = Depends(oauth2_scheme),
    x_request_id: Optional[str] = Header(None, description="Request ID for tracing")
):
    """
    Detect potential misuse of AI systems.
    
    This endpoint analyzes AI prompts or outputs for potential misuse,
    including prompt injection, data exfiltration attempts, and other
    forms of AI system abuse.
    """
    try:
        # Add request ID to logs if provided
        log_extra = {"request_id": x_request_id} if x_request_id else {}
        logger.info(
            f"AI misuse detection request received",
            extra={"prompt_preview": request.prompt[:100] + ("..." if len(request.prompt) > 100 else ""), **log_extra}
        )
        
        # Convert Pydantic model to dict for the analyzer
        input_data = request.dict(exclude_none=True)
        
        # Perform the analysis
        result = analyzer.analyze(input_data, scan_type="ai_misuse")
        
        # Format the response
        return AIMisuseResponse(
            scan_id=result["scan_id"],
            status=result["status"],
            timestamp=result["timestamp"],
            is_misuse=result["result"].get("is_misuse", False),
            confidence=result["result"].get("confidence", 0.0),
            risk_level=result["result"].get("risk_level", "low"),
            categories=result["result"].get("categories", []),
            explanation=result["result"].get("explanation"),
            recommendations=result["result"].get("recommendations", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI misuse detection failed: {str(e)}", exc_info=True, extra=log_extra)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI misuse detection failed: {str(e)}"
        )

class AIMisuseStats(BaseModel):
    """Model for AI misuse detection statistics."""
    total_requests: int
    misuse_detected: int
    false_positives: int
    detection_rate: float
    top_categories: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    last_updated: str

@router.get(
    "/stats",
    response_model=AIMisuseStats,
    status_code=status.HTTP_200_OK,
    summary="Get AI misuse detection statistics",
    description="Retrieve statistics about AI misuse detections."
)
async def get_ai_misuse_stats(
    time_window: int = Query(7, description="Time window in days", ge=1, le=365),
    token: str = Depends(oauth2_scheme)
):
    """
    Retrieve statistics about AI misuse detections.
    
    This endpoint returns aggregated statistics about AI misuse detections,
    including detection rates, common categories, and performance metrics.
    """
    try:
        # In a real implementation, you would query a database for these stats
        # For now, return mock data
        return {
            "total_requests": 8932,
            "misuse_detected": 423,
            "false_positives": 28,
            "detection_rate": 0.97,
            "top_categories": [
                {"category": "prompt_injection", "count": 156, "risk_level": "high"},
                {"category": "data_exfiltration", "count": 98, "risk_level": "critical"},
                {"category": "jailbreak_attempt", "count": 87, "risk_level": "high"},
                {"category": "toxic_content", "count": 65, "risk_level": "medium"},
                {"category": "privacy_violation", "count": 42, "risk_level": "high"}
            ],
            "risk_distribution": {
                "critical": 145,
                "high": 187,
                "medium": 78,
                "low": 13,
                "info": 0
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve AI misuse stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AI misuse statistics"
        )

class AIPromptModerationRequest(BaseModel):
    """Request model for AI prompt moderation."""
    prompt: str = Field(..., description="The prompt to moderate")
    user_id: Optional[str] = Field(None, description="ID of the user submitting the prompt")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class AIPromptModerationResponse(BaseModel):
    """Response model for AI prompt moderation."""
    is_approved: bool = Field(..., description="Whether the prompt is approved")
    is_flagged: bool = Field(..., description="Whether the prompt was flagged for review")
    flags: List[Dict[str, Any]] = Field(default_factory=list, description="Any flags raised during moderation")
    modified_prompt: Optional[str] = Field(None, description="Modified version of the prompt if changes were suggested")
    explanation: Optional[str] = Field(None, description="Explanation of the moderation decision")

@router.post(
    "/moderate",
    response_model=AIPromptModerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Moderate AI prompt",
    description="Moderate an AI prompt for policy compliance."
)
async def moderate_ai_prompt(
    request: AIPromptModerationRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Moderate an AI prompt for policy compliance.
    
    This endpoint checks if a prompt complies with content policies and
    returns a moderation decision, including any necessary modifications
    or flags for manual review.
    """
    try:
        # In a real implementation, this would use a moderation service
        # For now, we'll use a simple keyword-based approach
        
        # Define some basic moderation rules
        high_risk_terms = [
            # Add high-risk terms here
            "hack into", "exploit", "bypass security", "unauthorized access",
            "data breach", "exfiltrate", "privilege escalation", "zero day"
        ]
        
        medium_risk_terms = [
            # Add medium-risk terms here
            "password", "api key", "credentials", "token", "secret",
            "confidential", "proprietary", "intellectual property"
        ]
        
        # Check for high-risk terms
        flags = []
        for term in high_risk_terms:
            if term.lower() in request.prompt.lower():
                flags.append({
                    "term": term,
                    "risk_level": "high",
                    "reason": f"High-risk term detected: {term}"
                })
        
        # Check for medium-risk terms (only if no high-risk terms found)
        if not flags:
            for term in medium_risk_terms:
                if term.lower() in request.prompt.lower():
                    flags.append({
                        "term": term,
                        "risk_level": "medium",
                        "reason": f"Medium-risk term detected: {term}"
                    })
        
        # Make moderation decision
        is_approved = len([f for f in flags if f["risk_level"] == "high"]) == 0
        is_flagged = len(flags) > 0
        
        return AIPromptModerationResponse(
            is_approved=is_approved,
            is_flagged=is_flagged,
            flags=flags,
            explanation="Prompt was moderated based on content policy" if is_flagged else "Prompt is compliant"
        )
        
    except Exception as e:
        logger.error(f"AI prompt moderation failed: {str(e)}", exc_info=True)
        # Default to blocking on error (fail-safe)
        return AIPromptModerationResponse(
            is_approved=False,
            is_flagged=True,
            flags=[{"term": "system_error", "risk_level": "critical", "reason": "Moderation system error"}],
            explanation="Moderation failed due to a system error. Access denied by default."
        )
