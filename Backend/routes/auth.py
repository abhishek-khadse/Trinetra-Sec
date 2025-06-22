"""
Authentication routes for TrinetraSec API.

This module handles user authentication, registration, and account management
using Supabase as the authentication provider.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import logging

from core.security.jwt import create_jwt_token, JWTBearer, TokenPayload
from services.auth.supabase_service import (
    UserCreate, 
    UserLogin, 
    UserResponse,
    AuthResponse,
    SupabaseAuthError,
    supabase_auth
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

class TokenResponse(BaseModel):
    """Response model for token endpoints."""
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

class SignUpRequest(UserCreate):
    """Request model for user registration."""
    password_confirm: str
    
    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "password_confirm": "securepassword123",
                "user_metadata": {"full_name": "John Doe"},
                "email_confirm": False
            }
        }

class SignInRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str
    
    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }

class PasswordResetRequest(BaseModel):
    """Request model for password reset."""
    email: EmailStr
    
    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }

class PasswordUpdateRequest(BaseModel):
    """Request model for updating password."""
    current_password: str
    new_password: str
    
    class Config:
        schema_extra = {
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newsecurepassword123"
            }
        }

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password."
)
async def sign_up(request: SignUpRequest):
    """
    Register a new user account.
    
    This endpoint creates a new user with the provided email and password.
    If email confirmation is enabled, the user will need to confirm their email
    before they can sign in.
    """
    try:
        # Validate password confirmation
        if request.password != request.password_confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Create user in Supabase
        user_data = UserCreate(
            email=request.email,
            password=request.password,
            user_metadata=request.user_metadata or {},
            email_confirm=request.email_confirm
        )
        
        result = await supabase_auth.sign_up(user_data)
        
        # Generate JWT token
        expires_in = 3600  # 1 hour
        access_token = create_jwt_token(
            user_id=result["id"],
            email=result["email"],
            expires_delta=expires_in
        )
        
        # Prepare user info for response
        user_info = {
            "id": result["id"],
            "email": result["email"],
            "email_confirmed": result["email_confirmed"],
            "created_at": datetime.utcnow().isoformat()
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "refresh_token": result.get("refresh_token"),
            "user": user_info
        }
        
    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )

@router.post(
    "/token",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user",
    description="Authenticate a user with email and password, returning an access token."
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Authenticate a user and return an access token.
    
    This endpoint implements the OAuth2 password grant flow, allowing clients
    to exchange user credentials for an access token.
    """
    try:
        credentials = UserLogin(
            email=form_data.username,
            password=form_data.password
        )
        
        # Authenticate with Supabase
        result = await supabase_auth.sign_in(credentials)
        
        return TokenResponse(**result)
        
    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message or "Incorrect email or password"
        )
    except Exception as e:
        logger.error(f"Login failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Refresh an expired access token using a refresh token."
)
async def refresh_token(refresh_token: str):
    """
    Refresh an access token using a refresh token.
    
    This endpoint allows clients to obtain a new access token without requiring
    the user to re-authenticate, as long as the refresh token is still valid.
    """
    try:
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )
            
        # Refresh the token with Supabase
        result = await supabase_auth.refresh_token(refresh_token)
        
        # Get updated user info
        user_info = await supabase_auth.get_user(result["access_token"])
        
        # Create a new JWT
        expires_in = result.get("expires_in", 3600)
        access_token = create_jwt_token(
            user_id=user_info["id"],
            email=user_info["email"],
            role=user_info.get("role", "user"),
            expires_delta=expires_in
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "refresh_token": result.get("refresh_token", refresh_token),
            "user": user_info
        }
        
    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message or "Invalid refresh token"
        )
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh token"
        )

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out user",
    description="Invalidate the current access token and log out the user."
)
async def logout(
    token: str = Depends(JWTBearer()),
    response: Response = None
):
    """
    Log out the current user.
    
    This endpoint invalidates the current access token, effectively logging
    the user out of the current session.
    """
    try:
        # In a stateless JWT system, we can't revoke the token, but we can
        # remove it from the client and rely on short token expiration
        if response:
            response.delete_cookie("access_token")
            
        # If using Supabase's token, we could also invalidate it
        # await supabase_auth.sign_out(token)
        
        return None
        
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}", exc_info=True)
        # Even if logout fails, we still want to clear the token from the client
        if response:
            response.delete_cookie("access_token")
        return None

@router.post(
    "/password/reset",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Request password reset",
    description="Send a password reset email to the specified email address."
)
async def request_password_reset(request: PasswordResetRequest):
    """
    Request a password reset.
    
    This endpoint initiates the password reset flow by sending an email
    with a reset link to the specified email address.
    """
    try:
        success = await supabase_auth.reset_password(request.email)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send password reset email"
            )
            
        return {"message": "If an account with that email exists, a password reset link has been sent"}
        
    except SupabaseAuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message or "Failed to process password reset request"
        )
    except Exception as e:
        logger.error(f"Password reset request failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Get the currently authenticated user's information.",
    dependencies=[Depends(JWTBearer())]
)
async def get_current_user_info(
    current_user: TokenPayload = Depends(JWTBearer())
):
    """
    Get the currently authenticated user's information.
    
    This endpoint returns the profile information of the currently
    authenticated user.
    """
    try:
        # In a real implementation, you might fetch additional user data from your database
        return {
            "id": current_user.sub,
            "email": current_user.email,
            "role": current_user.role,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get user info: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )

# Example protected route that requires authentication
@router.get(
    "/protected",
    status_code=status.HTTP_200_OK,
    summary="Test protected route",
    description="A test endpoint that requires authentication.",
    dependencies=[Depends(JWTBearer())]
)
async def protected_route(
    current_user: TokenPayload = Depends(JWTBearer())
):
    """
    A test endpoint that requires authentication.
    
    This endpoint can be used to verify that authentication is working
    correctly. It returns information about the authenticated user.
    """
    return {
        "message": "You have accessed a protected route!",
        "user_id": current_user.sub,
        "email": current_user.email,
        "role": current_user.role
    }
