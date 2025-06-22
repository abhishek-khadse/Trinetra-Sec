"""
Security Analysis Modules

This package contains route modules for various security analysis features.
"""
from fastapi import APIRouter

# Import route modules
from . import ml_analysis

# Create a router for all module routes
router = APIRouter()

# Include all module routers
router.include_router(ml_analysis.router, tags=["ML Analysis"])

# Export the combined router
__all__ = ["router"]
