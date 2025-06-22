"""
Authentication routes for user registration, login, and session management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr, BaseModel, Field
from typing import Optional

from config import settings
from core.database import get_db
from core.utils.logger import logger as log
from core.security.rate_limiter import limiter
from .services.user_service import UserService, get_current_user
from core.database.models import User, AuditLog, AuditAction

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

class UserCreate(BaseModel):
    """User registration model."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)


class UserResponse(BaseModel):
    """User response model."""
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    is_active: bool
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        orm_mode = True


class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str
    expires_in: int


class TokenData(BaseModel):
    """Token data model."""
    email: Optional[str] = None


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def signup(
    user_data: UserCreate,
    request: Request,
    user_agent: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.
    
    - **email**: User's email address (must be unique)
    - **password**: Password (min 8 characters)
    - **first_name**: Optional first name
    - **last_name**: Optional last name
    """
    try:
        # Get client IP
        client_ip = request.client.host if request.client else None
        
        # Create user
        user = await UserService.create_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role="user"  # Default role
        )
        
        # Log the registration
        await AuditLog.log(
            db=db,
            action=AuditAction.CREATE,
            resource_type="user",
            resource_id=user.id,
            user_id=user.id,
            details={
                "action": "user_registered",
                "ip_address": client_ip,
                "user_agent": user_agent
            }
        )
        
        return user
        
    except HTTPException as he:
        log.error(f"Signup failed: {str(he.detail)}")
        raise
    except Exception as e:
        log.error(f"Error during signup: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@router.post(
    "/login",
    response_model=Token,
    summary="User login"
)
@limiter.limit("10/minute")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_agent: Optional[str] = Header(None),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate a user and return an access token.
    
    - **username**: User's email address
    - **password**: User's password
    """
    try:
        # Get client IP
        client_ip = request.client.host if request.client else None
        
        # Authenticate user
        user = await UserService.authenticate_user(
            db=db,
            email=form_data.username,
            password=form_data.password,
            user_agent=user_agent,
            ip_address=client_ip
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create session and get token
        token_data = await UserService.create_session(
            db=db,
            user=user,
            user_agent=user_agent,
            ip_address=client_ip
        )
        
        return token_data
        
    except HTTPException as he:
        log.warning(f"Login failed for {form_data.username}: {str(he.detail)}")
        raise
    except Exception as e:
        log.error(f"Error during login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user"
)
async def logout(
    request: Request,
    authorization: str = Header(..., description="Bearer token"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Log out the current user and invalidate the session token.
    """
    try:
        # Extract token from Authorization header
        token = authorization.split(" ")[1] if authorization.startswith("Bearer ") else None
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authorization header"
            )
        
        # Invalidate the session
        await UserService.logout(
            db=db,
            token=token,
            current_user=current_user
        )
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        log.error(f"Error during logout: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during logout"
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user info"
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get the currently authenticated user's information.
    """
    return current_user
