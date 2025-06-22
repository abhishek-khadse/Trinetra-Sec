"""
ML Analysis API Routes

This module contains API endpoints for various ML-based security analyses.
These endpoints provide a RESTful interface to interact with the ML models.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.engine.analyzer import SecurityAnalyzer
from core.database import get_db
from auth.services.user_service import get_current_user
from core.database.models import User
from core.utils.logger import logger

# Initialize router
router = APIRouter(prefix="/api/v1/ml", tags=["ML Analysis"])

# Initialize security analyzer
analyzer = SecurityAnalyzer()

# Pydantic models for request/response validation
class NetworkAnalysisRequest:
    """Request model for network traffic analysis."""
    def __init__(
        self,
        source_ip: str,
        dest_ip: str,
        source_port: int,
        dest_port: int,
        protocol: str,
        packet_count: int,
        byte_count: int,
        duration: float,
        **kwargs
    ):
        self.source_ip = source_ip
        self.dest_ip = dest_ip
        self.source_port = source_port
        self.dest_port = dest_port
        self.protocol = protocol
        self.packet_count = packet_count
        self.byte_count = byte_count
        self.duration = duration
        self.extra_data = kwargs

class APKAnalysisRequest:
    """Request model for APK analysis."""
    def __init__(
        self,
        package_name: str,
        version_name: str,
        version_code: int,
        min_sdk_version: int,
        target_sdk_version: int,
        permissions: list,
        activities: list = None,
        services: list = None,
        receivers: list = None,
        providers: list = None,
        **kwargs
    ):
        self.package_name = package_name
        self.version_name = version_name
        self.version_code = version_code
        self.min_sdk_version = min_sdk_version
        self.target_sdk_version = target_sdk_version
        self.permissions = permissions or []
        self.activities = activities or []
        self.services = services or []
        self.receivers = receivers or []
        self.providers = providers or []
        self.extra_data = kwargs

class PhishingDetectionRequest:
    """Request model for phishing detection."""
    def __init__(
        self,
        url: Optional[str] = None,
        html: Optional[str] = None,
        **kwargs
    ):
        if not url and not html:
            raise ValueError("Either url or html must be provided")
        self.url = url
        self.html = html
        self.extra_data = kwargs

class LLMAbuseDetectionRequest:
    """Request model for LLM abuse detection."""
    def __init__(
        self,
        prompt: str,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        self.prompt = prompt
        self.user_id = user_id
        self.context = context or {}
        self.extra_data = kwargs

# API Endpoints
@router.post("/network/analyze", summary="Analyze network traffic for threats")
async def analyze_network_traffic(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze network traffic for potential security threats.
    
    This endpoint accepts network traffic data and returns a threat analysis
    including risk score, threat level, and detailed findings.
    """
    try:
        # Parse and validate request data
        try:
            request = NetworkAnalysisRequest(**request_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid request data: {str(e)}"
            )
        
        # Call the analyzer
        result = await analyzer.analyze_network_traffic(
            traffic_data={
                "source_ip": request.source_ip,
                "dest_ip": request.dest_ip,
                "source_port": request.source_port,
                "dest_port": request.dest_port,
                "protocol": request.protocol,
                "packet_count": request.packet_count,
                "byte_count": request.byte_count,
                "duration": request.duration,
                **request.extra_data
            },
            user=current_user,
            db_session=db
        )
        
        return {
            "status": "success",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in network analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )

@router.post("/apk/analyze", summary="Analyze APK metadata for security issues")
async def analyze_apk(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze APK metadata for potential security issues.
    
    This endpoint accepts APK metadata and returns a security analysis
    including risk score, threat level, and detailed findings.
    """
    try:
        # Parse and validate request data
        try:
            request = APKAnalysisRequest(**request_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid request data: {str(e)}"
            )
        
        # Call the analyzer
        result = await analyzer.analyze_apk(
            apk_metadata={
                "package_name": request.package_name,
                "version_name": request.version_name,
                "version_code": request.version_code,
                "min_sdk_version": request.min_sdk_version,
                "target_sdk_version": request.target_sdk_version,
                "permissions": request.permissions,
                "activities": request.activities,
                "services": request.services,
                "receivers": request.receivers,
                "providers": request.providers,
                **request.extra_data
            },
            user=current_user,
            db_session=db
        )
        
        return {
            "status": "success",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in APK analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )

@router.post("/phishing/detect", summary="Detect phishing attempts in URLs or HTML")
async def detect_phishing(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Detect potential phishing attempts in URLs or HTML content.
    
    This endpoint accepts either a URL or HTML content and returns a phishing
    analysis including risk score, threat level, and detailed findings.
    """
    try:
        # Parse and validate request data
        try:
            request = PhishingDetectionRequest(**request_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid request data: {str(e)}"
            )
        
        # Call the analyzer
        result = await analyzer.detect_phishing(
            url=request.url,
            html=request.html,
            user=current_user,
            db_session=db
        )
        
        return {
            "status": "success",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in phishing detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )

@router.post("/llm/abuse-detect", summary="Detect potential abuse in LLM prompts")
async def detect_llm_abuse(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Detect potential abuse or harmful content in LLM prompts.
    
    This endpoint analyzes text prompts for potential abuse, harmful content,
    or policy violations, returning a risk assessment and recommended action.
    """
    try:
        # Parse and validate request data
        try:
            request = LLMAbuseDetectionRequest(**request_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid request data: {str(e)}"
            )
        
        # Call the analyzer
        result = await analyzer.detect_llm_abuse(
            prompt=request.prompt,
            user_id=request.user_id,
            context=request.context,
            user=current_user,
            db_session=db
        )
        
        return {
            "status": "success",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in LLM abuse detection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )

# Health check endpoint
@router.get("/health", summary="Check ML service health")
async def health_check():
    """Check if the ML analysis service is healthy."""
    try:
        # Try to initialize the analyzer
        await analyzer.initialize()
        return {
            "status": "healthy",
            "models_loaded": len(analyzer.models) > 0,
            "model_count": len(analyzer.models)
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )
