"""
Knowledge base package.

This package contains routes for accessing security knowledge base.
"""
from fastapi import APIRouter

# Create a router for knowledge base
router = APIRouter()

# Import and include all knowledge base routers
from . import web, app, ai, cloud

# Include all knowledge base routers
router.include_router(web.router, prefix="/web", tags=["knowledge"])
router.include_router(app.router, prefix="/app", tags=["knowledge"])
router.include_router(ai.router, prefix="/ai", tags=["knowledge"])
router.include_router(cloud.router, prefix="/cloud", tags=["knowledge"])
