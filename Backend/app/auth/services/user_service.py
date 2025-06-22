"""
User authentication and management services.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from core.database import get_db, User, Session as DBSession, AuditLog, AuditAction
from core.utils.logger import logger as log

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

class UserService:
    """Service for user authentication and management."""
    
    @staticmethod
    async def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash."""
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except Exception as e:
            log.error(f"Error verifying password: {str(e)}")
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate a password hash."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    async def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a new JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        return jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        """Get the current authenticated user from a JWT token."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        user = await User.get(db, user_id)
        if user is None:
            raise credentials_exception
            
        return user

    @classmethod
    async def get_current_active_user(
        cls,
        current_user: User = Depends(get_current_user)
    ) -> User:
        """Get the current active user."""
        if not current_user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        return current_user

    @classmethod
    async def create_user(
        cls,
        db: AsyncSession,
        email: str,
        password: str,
        first_name: str = None,
        last_name: str = None,
        role: str = "user"
    ) -> User:
        """Create a new user."""
        # Check if user already exists
        existing_user = await User.get(db, email=email, include_deleted=True)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = cls.get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            status="active"
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Log the action
        await AuditLog.log(
            db=db,
            action=AuditAction.CREATE,
            resource_type="user",
            resource_id=user.id,
            user_id=user.id,
            details={"action": "user_created"}
        )
        
        return user

    @classmethod
    async def authenticate_user(
        cls,
        db: AsyncSession,
        email: str,
        password: str,
        user_agent: str = None,
        ip_address: str = None
    ) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = await User.get(db, email=email, include_deleted=True)
        if not user:
            # Log failed login attempt
            await AuditLog.log(
                db=db,
                action=AuditAction.LOGIN,
                resource_type="user",
                details={
                    "email": email,
                    "success": False,
                    "reason": "user_not_found"
                }
            )
            return None
            
        if not await cls.verify_password(password, user.hashed_password):
            # Log failed login attempt
            await AuditLog.log(
                db=db,
                action=AuditAction.LOGIN,
                resource_type="user",
                user_id=user.id,
                details={
                    "success": False,
                    "reason": "invalid_password"
                }
            )
            return None
            
        if not user.is_active:
            # Log failed login attempt
            await AuditLog.log(
                db=db,
                action=AuditAction.LOGIN,
                resource_type="user",
                user_id=user.id,
                details={
                    "success": False,
                    "reason": "inactive_account"
                }
            )
            raise HTTPException(
                status_code=400,
                detail="Inactive user"
            )
            
        # Log successful login
        await AuditLog.log(
            db=db,
            action=AuditAction.LOGIN,
            resource_type="user",
            user_id=user.id,
            details={"success": True}
        )
        
        return user

    @classmethod
    async def create_session(
        cls,
        db: AsyncSession,
        user: User,
        user_agent: str = None,
        ip_address: str = None
    ) -> Dict[str, str]:
        """Create a new user session."""
        # Generate access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = await cls.create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        # Create session in database
        session = DBSession(
            user_id=user.id,
            token=access_token,
            expires_at=datetime.now(timezone.utc) + access_token_expires,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": int(access_token_expires.total_seconds())
        }

    @classmethod
    async def logout(
        cls,
        db: AsyncSession,
        token: str,
        current_user: User
    ) -> None:
        """Invalidate a user session."""
        # Delete the session
        result = await db.execute(
            """
            DELETE FROM sessions 
            WHERE token = :token AND user_id = :user_id
            RETURNING id
            """,
            {"token": token, "user_id": current_user.id}
        )
        
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        await db.commit()
        
        # Log the logout
        await AuditLog.log(
            db=db,
            action=AuditAction.LOGOUT,
            resource_type="user",
            resource_id=current_user.id,
            user_id=current_user.id,
            details={"action": "user_logout"}
        )

# Dependency to get the current active user
get_current_user = UserService.get_current_active_user
