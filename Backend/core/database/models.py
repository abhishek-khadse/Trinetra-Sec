"""
Database models for the application.
"""
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Any, Dict, List, Optional, Type, TypeVar, Generic

from sqlalchemy import (
    Column, 
    String, 
    Integer, 
    Boolean, 
    DateTime, 
    ForeignKey, 
    Text, 
    Enum,
    JSON,
    Index,
    UniqueConstraint,
    CheckConstraint,
    func,
    and_,
    or_
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship, declared_attr, Mapped, mapped_column
from sqlalchemy.sql.expression import text

from core.database.base import Base, get_db
from core.utils import generate_uuid, get_timestamp
from core.utils.logger import logger as log

# Type variables
T = TypeVar('T', bound='BaseModel')

class BaseModel(Base):
    """Base model with common fields and methods."""
    __abstract__ = True
    
    # Common fields
    id: Mapped[str] = mapped_column(
        String(36), 
        primary_key=True, 
        default=generate_uuid,
        index=True,
        unique=True,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        doc="Timestamp when the record was created"
    )
    
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
        doc="Timestamp when the record was last updated"
    )
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when the record was soft deleted"
    )
    
    # Soft delete flag
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Flag indicating if the record is soft deleted"
    )
    
    # Metadata
    __table_args__ = (
        {'extend_existing': True},
    )
    
    def to_dict(self, exclude: Optional[List[str]] = None) -> Dict[str, Any]:
        """Convert model to dictionary.
        
        Args:
            exclude: List of field names to exclude from the result
            
        Returns:
            Dictionary representation of the model
        """
        if exclude is None:
            exclude = []
            
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
            if column.name not in exclude and not column.name.startswith('_')
        }
    
    @classmethod
    async def get(
        cls: Type[T],
        db: AsyncSession,
        id: str,
        include_deleted: bool = False
    ) -> Optional[T]:
        """Get a record by ID.
        
        Args:
            db: Database session
            id: Record ID
            include_deleted: Whether to include soft-deleted records
            
        Returns:
            The record if found, None otherwise
        """
        query = db.query(cls).filter(cls.id == id)
        
        if not include_deleted:
            query = query.filter(cls.is_deleted.is_(False))
        
        result = await db.execute(query)
        return result.scalars().first()
    
    @classmethod
    async def get_all(
        cls: Type[T],
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        **filters
    ) -> List[T]:
        """Get multiple records with filtering and pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            include_deleted: Whether to include soft-deleted records
            **filters: Filter conditions (column=value)
            
        Returns:
            List of records
        """
        from sqlalchemy import and_
        from sqlalchemy.future import select
        
        stmt = select(cls)
        
        # Apply filters
        filter_conditions = []
        for key, value in filters.items():
            if hasattr(cls, key):
                if value is not None:
                    filter_conditions.append(getattr(cls, key) == value)
        
        if filter_conditions:
            stmt = stmt.where(and_(*filter_conditions))
        
        # Apply soft delete filter
        if not include_deleted:
            stmt = stmt.where(cls.is_deleted.is_(False))
        
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def delete(self, db: AsyncSession, hard: bool = False) -> bool:
        """Delete the record.
        
        Args:
            db: Database session
            hard: If True, perform a hard delete. Otherwise, soft delete.
            
        Returns:
            bool: True if the record was deleted, False otherwise
        """
        if hard:
            # Hard delete
            await db.delete(self)
        else:
            # Soft delete
            self.is_deleted = True
            self.deleted_at = datetime.now(timezone.utc)
        
        try:
            await db.commit()
            return True
        except Exception as e:
            await db.rollback()
            log.error(f"Error deleting {self.__class__.__name__} {self.id}: {str(e)}")
            return False
    
    async def update(self, db: AsyncSession, **kwargs) -> bool:
        """Update the record with the given attributes.
        
        Args:
            db: Database session
            **kwargs: Attributes to update
            
        Returns:
            bool: True if the update was successful, False otherwise
        """
        for key, value in kwargs.items():
            if hasattr(self, key) and not key.startswith('_'):
                setattr(self, key, value)
        
        self.updated_at = datetime.now(timezone.utc)
        
        try:
            await db.commit()
            await db.refresh(self)
            return True
        except Exception as e:
            await db.rollback()
            log.error(f"Error updating {self.__class__.__name__} {self.id}: {str(e)}")
            return False

# Enums
class UserRole(str, PyEnum):
    """User roles."""
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class UserStatus(str, PyEnum):
    """User account status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class AuditAction(str, PyEnum):
    """Audit log actions."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    PERMISSION_CHANGE = "permission_change"
    ROLE_CHANGE = "role_change"
    SETTINGS_UPDATE = "settings_update"

# Models
class User(BaseModel):
    """User account model."""
    __tablename__ = "users"
    
    # Authentication
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        index=True, 
        nullable=False,
        doc="User's email address (must be unique)"
    )
    
    hashed_password: Mapped[str] = mapped_column(
        String(255), 
        nullable=False,
        doc="Hashed password"
    )
    
    # Profile
    first_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="User's first name"
    )
    
    last_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="User's last name"
    )
    
    # Status
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.USER,
        nullable=False,
        index=True,
        doc="User's role (determines permissions)"
    )
    
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"),
        default=UserStatus.PENDING,
        nullable=False,
        index=True,
        doc="Account status"
    )
    
    # Contact
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        index=True,
        doc="User's phone number"
    )
    
    # Timestamps
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp of last login"
    )
    
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when email was verified"
    )
    
    # Metadata
    metadata_: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        doc="Additional metadata"
    )
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user", lazy="selectin")
    sessions = relationship("Session", back_populates="user", lazy="selectin")
    
    # Indexes
    __table_args__ = (
        Index('idx_users_email_lower', text('lower(email)'), unique=True),
        Index('idx_users_name', 'first_name', 'last_name'),
        {"extend_existing": True},
    )
    
    @property
    def full_name(self) -> str:
        """Get the user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or ""
    
    @property
    def is_active(self) -> bool:
        """Check if the user is active."""
        return self.status == UserStatus.ACTIVE and not self.is_deleted
    
    @property
    def is_superuser(self) -> bool:
        """Check if the user is a superuser."""
        return self.role == UserRole.SUPERADMIN
    
    @property
    def is_admin(self) -> bool:
        """Check if the user is an admin or superuser."""
        return self.role in (UserRole.ADMIN, UserRole.SUPERADMIN)
    
    def to_dict(self, exclude: Optional[List[str]] = None) -> Dict[str, Any]:
        """Convert user to dictionary, excluding sensitive fields by default."""
        if exclude is None:
            exclude = ["hashed_password"]
        else:
            exclude = list(set(exclude + ["hashed_password"]))
            
        data = super().to_dict(exclude=exclude)
        data["full_name"] = self.full_name
        data["is_active"] = self.is_active
        data["is_superuser"] = self.is_superuser
        data["is_admin"] = self.is_admin
        
        return data

class Session(BaseModel):
    """User session model."""
    __tablename__ = "sessions"
    
    # Foreign keys
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="ID of the user this session belongs to"
    )
    
    # Session data
    token: Mapped[str] = mapped_column(
        String(512),
        unique=True,
        index=True,
        nullable=False,
        doc="Session token"
    )
    
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        doc="IP address of the client"
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="User agent string of the client"
    )
    
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        doc="When the session expires"
    )
    
    # Relationships
    user = relationship("User", back_populates="sessions", lazy="selectin")
    
    # Indexes
    __table_args__ = (
        Index('idx_sessions_token', 'token', unique=True),
        {"extend_existing": True},
    )
    
    @property
    def is_expired(self) -> bool:
        """Check if the session has expired."""
        return datetime.now(timezone.utc) >= self.expires_at

class AuditLog(BaseModel):
    """Audit log model for tracking user actions."""
    __tablename__ = "audit_logs"
    
    # Foreign keys
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="ID of the user who performed the action (null for system actions)"
    )
    
    # Action details
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action"),
        nullable=False,
        index=True,
        doc="Type of action performed"
    )
    
    resource_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Type of resource that was affected"
    )
    
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True,
        doc="ID of the resource that was affected"
    )
    
    # Request details
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        doc="IP address of the client"
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="User agent string of the client"
    )
    
    # Additional data
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional details about the action"
    )
    
    # Relationships
    user = relationship("User", back_populates="audit_logs", lazy="selectin")
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_logs_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_logs_created_at', 'created_at'),
        {"extend_existing": True},
    )
    
    @classmethod
    async def log(
        cls,
        db: AsyncSession,
        action: AuditAction,
        resource_type: str,
        user_id: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        request: Any = None,
    ) -> 'AuditLog':
        """Create a new audit log entry.
        
        Args:
            db: Database session
            action: Type of action performed
            resource_type: Type of resource that was affected
            user_id: ID of the user who performed the action
            resource_id: ID of the resource that was affected
            details: Additional details about the action
            request: Optional request object to extract client info from
            
        Returns:
            The created AuditLog instance
        """
        log_entry = cls(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
        )
        
        # Extract client info from request if available
        if request:
            client_host = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
            if client_host:
                log_entry.ip_address = client_host
            if user_agent:
                log_entry.user_agent = user_agent
        
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        
        return log_entry
