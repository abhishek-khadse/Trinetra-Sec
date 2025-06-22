from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
import logging
import magic

from core.engine.analyzer import analyzer
from core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/content", tags=["content"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class ContentAnalysisRequest(BaseModel):
    """Request model for content analysis."""
    text: Optional[str] = Field(None, description="Text content to analyze")
    url: Optional[HttpUrl] = Field(None, description="URL to analyze")
    content_type: Optional[str] = Field(None, description="Content type (e.g., 'text/plain', 'text/html')")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class ContentAnalysisResponse(BaseModel):
    """Response model for content analysis."""
    scan_id: str = Field(..., description="Unique scan identifier")
    status: str = Field(..., description="Scan status")
    timestamp: str = Field(..., description="ISO format timestamp")
    scan_type: str = Field(..., description="Type of scan performed")
    result: Dict[str, Any] = Field(..., description="Analysis results")

@router.post(
    "/analyze",
    response_model=ContentAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze content for threats",
    description="Analyze text or URL content for potential security threats."
)
async def analyze_content(
    request: ContentAnalysisRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Analyze text or URL content for potential security threats.
    
    This endpoint analyzes content for various threats including:
    - Malicious scripts
    - Phishing indicators
    - Sensitive data exposure
    - Malware distribution attempts
    """
    try:
        # Validate input
        if not request.text and not request.url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'text' or 'url' must be provided"
            )
            
        # Convert Pydantic model to dict for the analyzer
        input_data = request.dict(exclude_none=True)
        
        # Perform the analysis
        result = analyzer.analyze(input_data, scan_type="content")
        
        return ContentAnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Content analysis failed: {str(e)}"
        )

@router.post(
    "/upload",
    response_model=ContentAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze uploaded file content",
    description="Upload and analyze file content for potential security threats."
)
async def analyze_uploaded_file(
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme)
):
    """
    Analyze uploaded file content for potential security threats.
    
    This endpoint accepts file uploads and analyzes their content for various
    security threats, including malware, sensitive data, and malicious code.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Determine content type if not provided
        content_type = file.content_type or magic.from_buffer(content, mime=True)
        
        # Prepare input data
        input_data = {
            "filename": file.filename,
            "content_type": content_type,
            "size": len(content),
            "content": content.decode('utf-8', errors='ignore') if content_type.startswith('text/') else "[binary content]"
        }
        
        # Perform the analysis
        result = analyzer.analyze(input_data, scan_type="file_upload")
        
        return ContentAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"File analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File analysis failed: {str(e)}"
        )

class ContentScanResult(BaseModel):
    """Model for content scan results."""
    scan_id: str
    timestamp: str
    threat_level: str
    risk_score: float
    indicators: List[Dict[str, Any]]

@router.get(
    "/results/{scan_id}",
    response_model=ContentScanResult,
    status_code=status.HTTP_200_OK,
    summary="Get content scan results",
    description="Get the results of a previous content scan by scan ID."
)
async def get_scan_results(
    scan_id: str,
    token: str = Depends(oauth2_scheme)
):
    """
    Retrieve the results of a previous content scan.
    
    This endpoint returns the detailed results of a content scan
    identified by the provided scan ID.
    """
    try:
        # In a real implementation, you would query a database for these results
        # For now, return mock data
        return {
            "scan_id": scan_id,
            "timestamp": datetime.utcnow().isoformat(),
            "threat_level": "low",
            "risk_score": 0.2,
            "indicators": [
                {"type": "suspicious_keyword", "value": "password", "severity": "low"},
                {"type": "suspicious_domain", "value": "example.malicious", "severity": "medium"}
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve scan results: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve scan results"
        )
