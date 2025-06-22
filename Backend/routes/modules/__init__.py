"""
Security analysis modules package.

This package contains modules for different types of security analysis.
"""
from fastapi import APIRouter

# Create a router for modules
router = APIRouter()

# Import and include all module routers
from . import static_malware, apk_analyzer

# Include all module routers
router.include_router(static_malware.router, prefix="/static", tags=["modules"])
router.include_router(apk_analyzer.router, prefix="/apk", tags=["modules"])
