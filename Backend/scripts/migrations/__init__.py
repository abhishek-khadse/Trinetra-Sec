"""
Database migrations package.

This package contains database migration scripts using Alembic.
"""
import os
from pathlib import Path
from typing import Optional

from alembic import command
from alembic.config import Config

# Get the migrations directory
MIGRATIONS_DIR = Path(__file__).parent.absolute()


def run_migrations(script_location: str, dsn: str) -> None:
    """Run database migrations.
    
    Args:
        script_location: Path to the migrations directory
        dsn: Database connection string
    """
    # Configure Alembic
    alembic_cfg = Config()
    alembic_cfg.set_main_option('script_location', script_location)
    alembic_cfg.set_main_option('sqlalchemy.url', dsn)
    
    # Run migrations
    command.upgrade(alembic_cfg, 'head')


def create_migration(message: str, dsn: str) -> Optional[str]:
    """Create a new migration.
    
    Args:
        message: Description of the migration
        dsn: Database connection string
        
    Returns:
        Path to the generated migration file, or None if no changes were detected
    """
    # Configure Alembic
    alembic_cfg = Config()
    alembic_cfg.set_main_option('script_location', str(MIGRATIONS_DIR))
    alembic_cfg.set_main_option('sqlalchemy.url', dsn)
    
    # Generate a new migration
    try:
        return command.revision(
            config=alembic_cfg,
            autogenerate=True,
            message=message
        )
    except Exception as e:
        if "Target database is not up to date" in str(e):
            return "Error: Database is not up to date. Run migrations first."
        raise
