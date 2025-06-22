"""
Database configuration and base models.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Type, TypeVar, Generic

from sqlalchemy import Column, DateTime, String, event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncAttrs
from sqlalchemy.orm import declarative_base, declared_attr, sessionmaker
from sqlalchemy.sql import func
from sqlalchemy.exc import SQLAlchemyError

from config import settings
from core.utils.logger import logger as log

# Type variables
T = TypeVar('T', bound='Base')

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URI,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
)

# Create async session factory
async_session_factory = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base model class
class Base(AsyncAttrs):
    """Base model class with common fields and methods."""
    
    __name__: str
    
    # Generate table name from class name (converts CamelCase to snake_case)
    @declared_attr
    def __tablename__(cls) -> str:
        return ''.join(['_' + i.lower() if i.isupper() else i for i in cls.__name__]).lstrip('_')
    
    # Common columns
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Soft delete flag
    is_deleted = Column(DateTime(timezone=True), nullable=True)
    
    @classmethod
    async def create(cls, db: AsyncSession, **kwargs) -> 'Base':
        """Create a new record."""
        try:
            instance = cls(**kwargs)
            db.add(instance)
            await db.commit()
            await db.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            await db.rollback()
            log.error(f"Error creating {cls.__name__}: {str(e)}")
            raise
    
    async def update(self, db: AsyncSession, **kwargs) -> 'Base':
        """Update the current record."""
        try:
            for key, value in kwargs.items():
                setattr(self, key, value)
            
            self.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(self)
            return self
        except SQLAlchemyError as e:
            await db.rollback()
            log.error(f"Error updating {self.__class__.__name__} {self.id}: {str(e)}")
            raise
    
    async def delete(self, db: AsyncSession, hard: bool = False) -> bool:
        """Delete the current record (soft delete by default)."""
        try:
            if hard:
                await db.delete(self)
            else:
                self.is_deleted = True
                self.deleted_at = datetime.now(timezone.utc)
            
            await db.commit()
            return True
        except SQLAlchemyError as e:
            await db.rollback()
            log.error(f"Error deleting {self.__class__.__name__} {self.id}: {str(e)}")
            raise
    
    @classmethod
    async def get(cls, db: AsyncSession, id: str) -> Optional['Base']:
        """Get a record by ID."""
        try:
            return await db.get(cls, id)
        except SQLAlchemyError as e:
            log.error(f"Error getting {cls.__name__} {id}: {str(e)}")
            raise
    
    @classmethod
    async def get_all(
        cls, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        **filters
    ) -> List['Base']:
        """Get all records with optional filtering and pagination."""
        from sqlalchemy.future import select
        from sqlalchemy import and_
        
        try:
            stmt = select(cls).where(cls.is_deleted.is_(None))
            
            # Apply filters
            if filters:
                filter_conditions = []
                for key, value in filters.items():
                    if hasattr(cls, key):
                        if value is not None:
                            filter_conditions.append(getattr(cls, key) == value)
                
                if filter_conditions:
                    stmt = stmt.where(and_(*filter_conditions))
            
            # Apply pagination
            stmt = stmt.offset(skip).limit(limit)
            
            result = await db.execute(stmt)
            return result.scalars().all()
        except SQLAlchemyError as e:
            log.error(f"Error getting all {cls.__name__}: {str(e)}")
            raise
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
            if column.name not in ('password_hash', 'is_deleted', 'deleted_at')
        }
    
    def __repr__(self) -> str:
        """String representation of the model."""
        return f"<{self.__class__.__name__}(id={self.id})>"

# Initialize declarative base
Base = declarative_base(cls=Base)

# Database session dependency
async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            log.error(f"Database error: {str(e)}")
            raise
        finally:
            await session.close()

# Event listeners
@event.listens_for(engine.sync_engine, 'engine_connect')
def ping_connection(dbapi_connection, connection_record, connection_proxy):
    """Ping the database connection to check if it's still alive."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute('SELECT 1')
        cursor.fetchone()
    except Exception as e:
        log.warning(f"Database connection lost: {str(e)}. Attempting to reconnect...")
        connection_proxy._pool.dispose()
        raise
    finally:
        cursor.close()

# Initialize database
async def init_db() -> None:
    """Initialize database tables."""
    from sqlalchemy import inspect
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        log.info("Database tables created")

# Cleanup database connections
async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()
    log.info("Database connections closed")
