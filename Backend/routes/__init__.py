"""
API routes package.

This package contains all the API route modules for the TrinetraSec backend.
"""
from fastapi import APIRouter

# Create a base router for all API routes
api_router = APIRouter()

# Import and include all route modules here
from .dashboard import dashboard as dashboard_router
from .modules import static_malware, apk_analyzer
from .learn import notes, quiz
from .knowledge import web, app as app_knowledge, ai, cloud

# Include all routers with their respective prefixes
api_router.include_router(dashboard_router.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(static_malware.router, prefix="/modules/static", tags=["modules"])
api_router.include_router(apk_analyzer.router, prefix="/modules/apk", tags=["modules"])
api_router.include_router(notes.router, prefix="/learn/notes", tags=["learn"])
api_router.include_router(quiz.router, prefix="/learn/quiz", tags=["learn"])
api_router.include_router(web.router, prefix="/knowledge/web", tags=["knowledge"])
api_router.include_router(app_knowledge.router, prefix="/knowledge/app", tags=["knowledge"])
api_router.include_router(ai.router, prefix="/knowledge/ai", tags=["knowledge"])
api_router.include_router(cloud.router, prefix="/knowledge/cloud", tags=["knowledge"])
