#!/usr/bin/env python3
"""
Database migration script using Alembic.

This script provides a command-line interface for managing database migrations.
"""
import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Optional

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.absolute()))

from core.database.migrations import (
    init_migrations,
    create_migration,
    upgrade_database,
    downgrade_database,
    check_migrations,
    get_database_version,
    create_initial_migration,
    migrate_database,
)
from core.database.base import engine
from core.utils.logger import logger as log

# Configure logging
log.setLevel("INFO")

async def run_migrations() -> None:
    """Run all pending migrations."""
    log.info("Running database migrations...")
    await migrate_database()
    log.info("Database migrations completed successfully")

async def create_new_migration(message: str) -> None:
    """Create a new migration.
    
    Args:
        message: Migration message
    """
    log.info(f"Creating new migration: {message}")
    migration_file = await create_migration(message=message, autogenerate=True)
    
    if migration_file:
        log.info(f"Created migration: {migration_file}")
    else:
        log.info("No changes detected, no migration created")

async def show_status() -> None:
    """Show the current database migration status."""
    current_rev = await get_database_version(engine)
    log.info(f"Current database revision: {current_rev or 'None'}")
    
    is_up_to_date = await check_migrations()
    if is_up_to_date:
        log.info("Database is up to date")
    else:
        log.warning("Database is not up to date. Run 'python -m scripts.migrate upgrade' to apply migrations.")

async def init_database() -> None:
    """Initialize the database with the first migration."""
    log.info("Initializing database...")
    await init_migrations()
    
    # Create initial migration
    migration_file = await create_initial_migration()
    if migration_file:
        log.info(f"Created initial migration: {migration_file}")
    
    # Apply migrations
    await run_migrations()

def parse_args() -> argparse.Namespace:
    """Parse command line arguments.
    
    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Database migration tool")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize database and migrations")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new migration")
    create_parser.add_argument("message", help="Migration message")
    
    # Upgrade command
    upgrade_parser = subparsers.add_parser("upgrade", help="Upgrade to a later version")
    upgrade_parser.add_argument(
        "revision", 
        nargs="?", 
        default="head", 
        help="Target revision (default: head)"
    )
    
    # Downgrade command
    downgrade_parser = subparsers.add_parser("downgrade", help="Revert to a previous version")
    downgrade_parser.add_argument(
        "revision", 
        nargs="?", 
        default="-1", 
        help="Target revision (default: previous revision)"
    )
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Show current migration status")
    
    # Run command (default)
    run_parser = subparsers.add_parser("run", help="Run all pending migrations (default)")
    
    # Set default command to 'run'
    parser.set_defaults(func=run_migrations)
    
    return parser.parse_args()

async def main() -> int:
    """Main entry point.
    
    Returns:
        int: Exit code (0 for success, non-zero for error)
    """
    args = parse_args()
    
    try:
        # Map commands to functions
        if args.command == "init":
            await init_database()
        elif args.command == "create":
            await create_new_migration(args.message)
        elif args.command == "upgrade":
            await upgrade_database(args.revision)
        elif args.command == "downgrade":
            await downgrade_database(args.revision)
        elif args.command == "status":
            await show_status()
        elif args.command == "run" or args.command is None:
            await run_migrations()
        else:
            log.error(f"Unknown command: {args.command}")
            return 1
            
        return 0
    except Exception as e:
        log.error(f"Error: {str(e)}", exc_info=True)
        return 1
    finally:
        await engine.dispose()

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
