"""
Supabase Authentication Service

This module provides authentication and user management using Supabase.
"""
from typing import Optional, Dict, Any, Tuple
import logging
from datetime import datetime, timedelta

import httpx
from pydantic import BaseModel, EmailStr, validator

from config import settings
from core.security.jwt import create_jwt_token

logger = logging.getLogger(__name__)

# Supabase Auth API endpoints
SUPABASE_AUTH_URL = f"{settings.SUPABASE_URL}/auth/v1"

class UserCreate(BaseModel):
    """Model for user creation."""
    email: EmailStr
    password: str
    user_metadata: Optional[Dict[str, Any]] = {}
    email_confirm: bool = False
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    """Model for user login."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Response model for user data."""
    id: str
    email: str
    role: str = "user"
    email_confirmed_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_metadata: Dict[str, Any] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class AuthResponse(BaseModel):
    """Authentication response model."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class SupabaseAuthError(Exception):
    """Custom exception for Supabase auth errors."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class SupabaseAuthService:
    """Service for handling Supabase authentication."""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize the Supabase auth service."""
        self.supabase_url = supabase_url or settings.SUPABASE_URL
        self.supabase_key = supabase_key or settings.SUPABASE_KEY
        self.auth_url = f"{self.supabase_url}/auth/v1"
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Tuple[dict, int]:
        """Make an HTTP request to the Supabase Auth API."""
        url = f"{self.auth_url}{endpoint}"
        
        # Ensure headers are set
        headers = self.headers.copy()
        if 'headers' in kwargs:
            headers.update(kwargs.pop('headers'))
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method,
                    url,
                    headers=headers,
                    **kwargs
                )
                
                response.raise_for_status()
                return response.json() if response.content else {}, response.status_code
                
            except httpx.HTTPStatusError as e:
                error_data = e.response.json() if e.response.content else {}
                error_msg = error_data.get('error_description') or error_data.get('message', str(e))
                logger.error(f"Supabase API error: {error_msg}")
                raise SupabaseAuthError(error_msg, status_code=e.response.status_code) from e
            except Exception as e:
                logger.error(f"Request to Supabase failed: {str(e)}")
                raise SupabaseAuthError(str(e), status_code=500) from e
    
    async def sign_up(self, user_data: UserCreate) -> Dict[str, Any]:
        """Register a new user."""
        data = {
            "email": user_data.email,
            "password": user_data.password,
            "user_metadata": user_data.user_metadata,
            "email_confirm": user_data.email_confirm
        }
        
        try:
            response, status_code = await self._make_request(
                "POST",
                "/signup",
                json=data
            )
            
            if status_code == 200 and response.get('user'):
                return {
                    "id": response['user']['id'],
                    "email": response['user']['email'],
                    "email_confirmed": response['user'].get('email_confirmed_at') is not None,
                    "access_token": response.get('access_token'),
                    "refresh_token": response.get('refresh_token')
                }
            
            raise SupabaseAuthError("Failed to create user", status_code=status_code)
            
        except Exception as e:
            logger.error(f"Signup failed: {str(e)}")
            raise
    
    async def sign_in(self, credentials: UserLogin) -> Dict[str, Any]:
        """Authenticate a user and return tokens."""
        data = {
            "email": credentials.email,
            "password": credentials.password
        }
        
        try:
            response, status_code = await self._make_request(
                "POST",
                "/token?grant_type=password",
                json=data
            )
            
            if status_code == 200 and 'access_token' in response:
                # Get user details
                user_info = await self.get_user(response['access_token'])
                
                # Create JWT token
                expires_in = response.get('expires_in', 3600)  # Default to 1 hour
                access_token = create_jwt_token(
                    user_id=user_info['id'],
                    email=user_info['email'],
                    role=user_info.get('role', 'user'),
                    expires_delta=timedelta(seconds=expires_in)
                )
                
                return {
                    "access_token": access_token,
                    "refresh_token": response.get('refresh_token'),
                    "token_type": "bearer",
                    "expires_in": expires_in,
                    "user": user_info
                }
            
            raise SupabaseAuthError("Invalid email or password", status_code=401)
            
        except SupabaseAuthError:
            raise
        except Exception as e:
            logger.error(f"Sign in failed: {str(e)}")
            raise SupabaseAuthError("Authentication failed", status_code=500)
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh an access token using a refresh token."""
        try:
            response, status_code = await self._make_request(
                "POST",
                "/token?grant_type=refresh_token",
                json={"refresh_token": refresh_token}
            )
            
            if status_code == 200 and 'access_token' in response:
                return {
                    "access_token": response['access_token'],
                    "refresh_token": response.get('refresh_token', refresh_token),
                    "token_type": response.get('token_type', 'bearer'),
                    "expires_in": response.get('expires_in', 3600)
                }
            
            raise SupabaseAuthError("Failed to refresh token", status_code=status_code)
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise SupabaseAuthError("Token refresh failed", status_code=401)
    
    async def get_user(self, access_token: str) -> Dict[str, Any]:
        """Get user information using an access token."""
        try:
            response, status_code = await self._make_request(
                "GET",
                "/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if status_code == 200 and 'id' in response:
                return {
                    "id": response['id'],
                    "email": response.get('email'),
                    "email_confirmed": response.get('email_confirmed_at') is not None,
                    "role": response.get('user_metadata', {}).get('role', 'user'),
                    "created_at": response.get('created_at'),
                    "updated_at": response.get('updated_at'),
                    "last_sign_in_at": response.get('last_sign_in_at'),
                    "user_metadata": response.get('user_metadata', {})
                }
            
            raise SupabaseAuthError("User not found", status_code=404)
            
        except Exception as e:
            logger.error(f"Failed to get user: {str(e)}")
            raise SupabaseAuthError("Failed to retrieve user information", status_code=500)
    
    async def sign_out(self, access_token: str) -> bool:
        """Sign out a user by invalidating the access token."""
        try:
            _, status_code = await self._make_request(
                "POST",
                "/logout",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            return status_code == 204
            
        except Exception as e:
            logger.error(f"Sign out failed: {str(e)}")
            return False
    
    async def reset_password(self, email: str) -> bool:
        """Initiate password reset for a user."""
        try:
            _, status_code = await self._make_request(
                "POST",
                "/recover",
                json={"email": email}
            )
            
            return status_code == 200
            
        except Exception as e:
            logger.error(f"Password reset failed: {str(e)}")
            return False
    
    async def update_user(
        self,
        access_token: str,
        email: Optional[str] = None,
        password: Optional[str] = None,
        user_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update user information."""
        data = {}
        if email is not None:
            data['email'] = email
        if password is not None:
            data['password'] = password
        if user_metadata is not None:
            data['data'] = user_metadata
        
        try:
            response, status_code = await self._make_request(
                "PUT",
                "/user",
                headers={"Authorization": f"Bearer {access_token}"},
                json=data
            )
            
            if status_code == 200 and 'id' in response:
                return {
                    "id": response['id'],
                    "email": response.get('email'),
                    "email_confirmed": response.get('email_confirmed_at') is not None,
                    "updated_at": response.get('updated_at')
                }
            
            raise SupabaseAuthError("Failed to update user", status_code=status_code)
            
        except Exception as e:
            logger.error(f"User update failed: {str(e)}")
            raise SupabaseAuthError("Failed to update user", status_code=500)

# Global instance
supabase_auth = SupabaseAuthService()
