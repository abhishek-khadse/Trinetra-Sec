"""
Database package for the application.

This package contains database models, migrations, and utilities.
"""
from typing import Any, Dict, List, Optional, Type, TypeVar, Union

from sqlalchemy.ext.asyncio import AsyncSession

from .base import (
    Base,
    engine,
    async_session_factory,
    get_db,
    init_db,
    close_db
)

from .migrations import (
    get_alembic_config,
    get_database_version,
    ensure_migrations_table,
    init_migrations,
    create_migration,
    upgrade_database,
    downgrade_database,
    check_migrations,
    create_initial_migration,
    migrate_database
)

from .models import (
    # Base models
    BaseModel,
    
    # Enums
    UserRole,
    UserStatus,
    AuditAction,
    
    # Models
    User,
    Session,
    AuditLog,
)

# Re-export common types and utilities
__all__ = [
    # Base
    'Base',
    'engine',
    'async_session_factory',
    'get_db',
    'init_db',
    'close_db',
    
    # Migrations
    'get_alembic_config',
    'get_database_version',
    'ensure_migrations_table',
    'init_migrations',
    'create_migration',
    'upgrade_database',
    'downgrade_database',
    'check_migrations',
    'create_initial_migration',
    'migrate_database',
    
    # Models
    'BaseModel',
    'UserRole',
    'UserStatus',
    'AuditAction',
    'User',
    'Session',
    'AuditLog',
]

# Initialize database models when the package is imported
# This ensures all models are registered with SQLAlchemy
# and can be discovered by Alembic for migrations
def init_models() -> None:
    """Initialize database models."""
    # Import all models here to ensure they are registered with SQLAlchemy
    from . import models  # noqa: F401
    
    # Create all tables if they don't exist
    # Note: In production, use migrations instead
    async def _init() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    import asyncio
    asyncio.run(_init())

# Run initialization when the package is imported
init_models()
