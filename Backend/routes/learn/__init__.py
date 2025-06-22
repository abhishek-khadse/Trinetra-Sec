"""
Learning resources package.

This package contains routes for learning resources like notes and quizzes.
"""
from fastapi import APIRouter

# Create a router for learning resources
router = APIRouter()

# Import and include all learning resource routers
from . import notes, quiz

# Include all learning resource routers
router.include_router(notes.router, prefix="/notes", tags=["learn"])
router.include_router(quiz.router, prefix="/quiz", tags=["learn"])
