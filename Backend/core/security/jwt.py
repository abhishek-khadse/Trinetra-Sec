"""
JWT Authentication and Authorization utilities.

This module provides functions for JWT token handling, verification,
and user authentication/authorization.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from config import settings

# JWT Configuration
ALGORITHM = "HS256"

class TokenPayload(BaseModel):
    """JWT token payload model."""
    sub: str  # Subject (user ID)
    email: str
    role: str = "user"
    exp: Optional[datetime] = None
    iat: Optional[datetime] = None

class JWTBearer(HTTPBearer):
    """JWT Bearer token authentication."""
    
    def __init__(self, auto_error: bool = True, required_roles: list = None):
        super().__init__(auto_error=auto_error)
        self.required_roles = required_roles or []
    
    async def __call__(self, request: Request) -> TokenPayload:
        """Validate and return the token payload."""
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authorization code."
            )
        if credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme. Use 'Bearer'"
            )
        
        # Verify token and get payload
        token = credentials.credentials
        try:
            payload = verify_jwt_token(token)
            
            # Check roles if required
            if self.required_roles and payload.role not in self.required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
                
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Token validation failed: {str(e)}"
            )

def create_jwt_token(
    user_id: str,
    email: str,
    role: str = "user",
    expires_delta: Optional[timedelta] = None,
    secret_key: str = settings.SECRET_KEY,
    algorithm: str = ALGORITHM
) -> str:
    """
    Create a new JWT token.
    
    Args:
        user_id: Unique user identifier
        email: User's email address
        role: User role (default: 'user')
        expires_delta: Optional timedelta for token expiration
        secret_key: Secret key for signing the token
        algorithm: Hashing algorithm to use
        
    Returns:
        Encoded JWT token as string
    """
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": expire
    }
    
    return jwt.encode(payload, secret_key, algorithm=algorithm)

def verify_jwt_token(
    token: str,
    secret_key: str = settings.SECRET_KEY,
    algorithm: str = ALGORITHM
) -> TokenPayload:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        secret_key: Secret key used to sign the token
        algorithm: Hashing algorithm to use
        
    Returns:
        TokenPayload containing decoded token data
        
    Raises:
        jwt.ExpiredSignatureError: If token has expired
        jwt.InvalidTokenError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[algorithm],
            options={"verify_aud": False}
        )
        
        # Convert exp and iat to datetime
        if "exp" in payload:
            payload["exp"] = datetime.fromtimestamp(payload["exp"])
        if "iat" in payload:
            payload["iat"] = datetime.fromtimestamp(payload["iat"])
        
        return TokenPayload(**payload)
        
    except jwt.PyJWTError as e:
        raise

def get_current_user(
    token: str = Depends(HTTPBearer(auto_error=False))
) -> TokenPayload:
    """
    Dependency to get the current authenticated user from the JWT token.
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        TokenPayload with user information
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        payload = verify_jwt_token(token.credentials)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

def get_current_active_user(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """
    Dependency to get the current active user.
    
    This can be extended to check for additional user statuses.
    """
    # Add any additional checks here (e.g., user active status)
    return current_user

def get_current_admin_user(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """Dependency to check if the current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user

# Common dependencies for routes
requires_auth = JWTBearer()
requires_admin = JWTBearer(required_roles=["admin"])
requires_editor = JWTBearer(required_roles=["editor", "admin"])

# Example of how to use in a route:
# @router.get("/protected")
# async def protected_route(user: TokenPayload = Depends(requires_auth)):
#     return {"user_id": user.sub, "role": user.role}
