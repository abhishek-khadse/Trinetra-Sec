"""
Learning center quiz routes.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from pydantic import BaseModel, Field, validator

from config import settings
from core.database import get_db, Quiz, QuizAttempt, User
from core.utils.logger import logger as log
from auth.services.user_service import get_current_user

router = APIRouter(prefix="/api/v1/learn/quiz", tags=["Learning - Quiz"])

# Models
class QuizQuestion(BaseModel):
    """Quiz question model."""
    id: str
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None

class QuizCreate(BaseModel):
    """Quiz creation model."""
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    questions: List[Dict[str, Any]] = Field(..., min_items=1)
    difficulty: str = Field("beginner", regex="^(beginner|intermediate|advanced)$")
    
    @validator('questions')
    def validate_questions(cls, v):
        """Validate quiz questions."""
        for i, q in enumerate(v):
            if not all(k in q for k in ['question', 'options', 'correct_index']):
                raise ValueError(f"Question {i+1} is missing required fields")
            if not isinstance(q['options'], list) or len(q['options']) < 2:
                raise ValueError(f"Question {i+1} must have at least 2 options")
            if not 0 <= q['correct_index'] < len(q['options']):
                raise ValueError(f"Question {i+1} has an invalid correct_index")
        return v

class QuizResponse(BaseModel):
    """Quiz response model."""
    id: str
    title: str
    description: Optional[str]
    question_count: int
    difficulty: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class QuizDetailResponse(QuizResponse):
    """Detailed quiz response model with questions."""
    questions: List[Dict[str, Any]]

class QuizAttemptCreate(BaseModel):
    """Quiz attempt submission model."""
    quiz_id: str
    answers: Dict[str, int]  # question_id: selected_option_index

class QuizAttemptResponse(BaseModel):
    """Quiz attempt response model."""
    id: str
    quiz_id: str
    user_id: str
    score: float
    passed: bool
    total_questions: int
    correct_answers: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class QuizProgressResponse(BaseModel):
    """User's quiz progress response model."""
    total_attempts: int
    average_score: float
    quizzes_taken: int
    passed_quizzes: int
    last_attempt: Optional[datetime]
    by_difficulty: Dict[str, Dict[str, float]]
    recent_attempts: List[Dict[str, Any]]

# Routes
@router.get(
    "",
    response_model=List[QuizResponse],
    summary="List available quizzes"
)
async def list_quizzes(
    difficulty: Optional[str] = Query(None, regex="^(beginner|intermediate|advanced)$"),
    limit: int = Query(10, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all available quizzes with optional filtering by difficulty.
    
    - **difficulty**: Filter by difficulty level (beginner, intermediate, advanced)
    - **limit**: Maximum number of results to return (1-100)
    - **offset**: Pagination offset
    """
    try:
        query = select(Quiz).where(Quiz.is_active == True)
        
        if difficulty:
            query = query.where(Quiz.difficulty == difficulty.lower())
        
        result = await db.execute(
            query.order_by(Quiz.created_at.desc())
            .offset(offset).limit(limit)
        )
        
        quizzes = result.scalars().all()
        return quizzes
        
    except Exception as e:
        log.error(f"Error listing quizzes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving quizzes"
        )

@router.get(
    "/{quiz_id}",
    response_model=QuizDetailResponse,
    summary="Get quiz details"
)
async def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific quiz including questions.
    
    - **quiz_id**: ID of the quiz to retrieve
    """
    try:
        quiz = await Quiz.get(db, id=quiz_id, is_active=True)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found or inactive"
            )
            
        return quiz
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error retrieving quiz {quiz_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the quiz"
        )

@router.post(
    "/submit",
    response_model=QuizAttemptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit quiz answers"
)
async def submit_quiz(
    attempt_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit answers to a quiz and get results.
    
    Request body should contain a dictionary mapping question IDs to the index
    of the selected answer option.
    """
    try:
        # Get the quiz
        quiz = await Quiz.get(db, id=attempt_data.quiz_id, is_active=True)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found or inactive"
            )
        
        # Calculate score
        total_questions = len(quiz.questions)
        if total_questions == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz has no questions"
            )
        
        correct_answers = 0
        answer_results = {}
        
        # Validate and score each answer
        for q in quiz.questions:
            q_id = q.get('id')
            if not q_id:
                continue
                
            user_answer = attempt_data.answers.get(q_id)
            correct_index = q.get('correct_index', -1)
            is_correct = user_answer == correct_index
            
            answer_results[q_id] = {
                'user_answer': user_answer,
                'correct_answer': correct_index,
                'is_correct': is_correct,
                'explanation': q.get('explanation')
            }
            
            if is_correct:
                correct_answers += 1
        
        # Calculate score percentage
        score = (correct_answers / total_questions) * 100
        passed = score >= 70  # Passing threshold
        
        # Create attempt record
        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=current_user.id,
            score=score,
            passed=passed,
            total_questions=total_questions,
            correct_answers=correct_answers,
            answers=answer_results
        )
        
        await attempt.save(db)
        
        return attempt
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error submitting quiz: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your quiz submission"
        )

@router.get(
    "/attempts/{attempt_id}",
    response_model=QuizAttemptResponse,
    summary="Get quiz attempt details"
)
async def get_quiz_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed results for a specific quiz attempt.
    
    - **attempt_id**: ID of the quiz attempt to retrieve
    """
    try:
        # Get attempt with user verification
        result = await db.execute(
            select(QuizAttempt)
            .where(and_(
                QuizAttempt.id == attempt_id,
                QuizAttempt.user_id == current_user.id
            ))
        )
        
        attempt = result.scalars().first()
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz attempt not found or access denied"
            )
            
        return attempt
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error retrieving quiz attempt {attempt_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the quiz attempt"
        )

@router.get(
    "/progress",
    response_model=QuizProgressResponse,
    summary="Get user's quiz progress"
)
async def get_quiz_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistics and progress for the current user's quiz attempts.
    """
    try:
        # Get all user attempts
        result = await db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == current_user.id)
            .order_by(QuizAttempt.created_at.desc())
        )
        attempts = result.scalars().all()
        
        if not attempts:
            return {
                "total_attempts": 0,
                "average_score": 0,
                "quizzes_taken": 0,
                "passed_quizzes": 0,
                "last_attempt": None,
                "by_difficulty": {},
                "recent_attempts": []
            }
        
        # Calculate basic stats
        total_attempts = len(attempts)
        total_score = sum(a.score for a in attempts)
        average_score = total_score / total_attempts
        
        # Get unique quizzes and passed quizzes
        quiz_ids = {a.quiz_id for a in attempts}
        passed_quizzes = len({a.quiz_id for a in attempts if a.passed})
        
        # Group by difficulty
        difficulty_stats = {}
        for diff in ['beginner', 'intermediate', 'advanced']:
            diff_attempts = [a for a in attempts if a.quiz and a.quiz.difficulty == diff]
            if not diff_attempts:
                continue
                
            diff_scores = [a.score for a in diff_attempts]
            difficulty_stats[diff] = {
                "attempts": len(diff_attempts),
                "average_score": sum(diff_scores) / len(diff_scores),
                "passed": sum(1 for a in diff_attempts if a.passed),
                "best_score": max(diff_scores)
            }
        
        # Prepare recent attempts
        recent_attempts = []
        for a in attempts[:5]:  # Last 5 attempts
            recent_attempts.append({
                "quiz_id": a.quiz_id,
                "quiz_title": a.quiz.title if a.quiz else "Unknown Quiz",
                "score": a.score,
                "passed": a.passed,
                "date": a.created_at
            })
        
        return {
            "total_attempts": total_attempts,
            "average_score": round(average_score, 2),
            "quizzes_taken": len(quiz_ids),
            "passed_quizzes": passed_quizzes,
            "last_attempt": attempts[0].created_at,
            "by_difficulty": difficulty_stats,
            "recent_attempts": recent_attempts
        }
        
    except Exception as e:
        log.error(f"Error getting quiz progress: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving quiz progress"
        )
