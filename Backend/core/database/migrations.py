"""
Database migration utilities for managing schema changes.
"""
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple, Union

import sqlalchemy
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from config import settings
from core.database.base import Base, engine
from core.utils.logger import logger as log

# Migration configuration
MIGRATIONS_DIR = Path("migrations")
MIGRATIONS_SCRIPT_LOCATION = str(MIGRATIONS_DIR / "versions")
MIGRATIONS_REVISION_TEMPLATE = "{rev}_{slug}"

# Ensure migrations directory exists
os.makedirs(MIGRATIONS_DIR / "versions", exist_ok=True)

def get_alembic_config(database_uri: Optional[str] = None) -> Config:
    """Get Alembic configuration.
    
    Args:
        database_uri: Database URI. If None, uses the default from settings.
        
    Returns:
        Configured Alembic Config instance.
    """
    database_uri = database_uri or settings.DATABASE_URI
    
    # Create Alembic config
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIR.absolute()))
    config.set_main_option("sqlalchemy.url", database_uri.replace("asyncpg", "postgresql"))
    
    # Configure logging
    config.attributes["configure_logger"] = False
    
    return config

async def get_database_version(engine: AsyncEngine) -> Optional[str]:
    """Get the current database version.
    
    Args:
        engine: Async SQLAlchemy engine.
        
    Returns:
        Current revision ID or None if not initialized.
    """
    async with engine.connect() as conn:
        # Check if alembic_version table exists
        result = await conn.execute(
            text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'alembic_version'
            """)
        )
        
        if not result.fetchone():
            return None
        
        # Get current version
        result = await conn.execute(
            text("SELECT version_num FROM alembic_version LIMIT 1")
        )
        
        if row := result.fetchone():
            return row[0]
        
        return None

async def ensure_migrations_table(engine: AsyncEngine) -> None:
    """Ensure the alembic_version table exists."""
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: sync_conn.execute(
                text("""
                    CREATE TABLE IF NOT EXISTS alembic_version (
                        version_num VARCHAR(32) NOT NULL,
                        CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                    )
                """)
            )
        )

async def init_migrations() -> None:
    """Initialize database migrations."""
    # Create migrations directory if it doesn't exist
    os.makedirs(MIGRATIONS_DIR / "versions", exist_ok=True)
    
    # Create env.py if it doesn't exist
    env_py = MIGRATIONS_DIR / "env.py"
    if not env_py.exists():
        # Create a minimal env.py
        env_py.write_text("""
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database.base import Base
from config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.DATABASE_URI
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
""")
        
        # Create script.py.mako
        script_py_mako = MIGRATIONS_DIR / "script.py.mako"
        if not script_py_mako.exists():
            script_py_mako.write_text("""
"""${up_revision}"""
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
""")
        
        log.info("Initialized migrations directory")
    
    # Create initial migration if needed
    config = get_alembic_config()
    script = ScriptDirectory.from_config(config)
    
    if not script.get_heads():
        # Create initial migration
        command.revision(
            config,
            message="Initial migration",
            autogenerate=True,
            version_path=str(MIGRATIONS_DIR.absolute() / "versions"),
            head="base"
        )
        log.info("Created initial migration")
    
    # Ensure migrations table exists
    await ensure_migrations_table(engine)

async def create_migration(
    message: str = "auto",
    autogenerate: bool = True,
    sql: bool = False,
    head: str = "head",
    splice: bool = False,
    branch_label: Optional[str] = None,
    version_path: Optional[str] = None,
    rev_id: Optional[str] = None,
    depends_on: Optional[str] = None,
) -> Optional[str]:
    """Create a new migration.
    
    Args:
        message: Migration message.
        autogenerate: Whether to auto-generate migration scripts.
        sql: If True, generate SQL script instead of running migrations.
        head: Target head revision or 'head' for the latest revision.
        splice: Whether to allow non-head down revisions.
        branch_label: Optional branch label to apply to the new revision.
        version_path: Path to the versions directory.
        rev_id: Optional revision ID to use instead of generating one.
        depends_on: Optional list of revision identifiers this migration depends on.
        
    Returns:
        Path to the generated migration file, or None if no changes were detected.
    """
    config = get_alembic_config()
    
    # Set up version path
    if version_path is None:
        version_path = MIGRATIONS_SCRIPT_LOCATION
    
    # Generate revision ID if not provided
    if rev_id is None:
        rev_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    # Create the revision
    revision = command.revision(
        config,
        message=message,
        autogenerate=autogenerate,
        sql=sql,
        head=head,
        splice=splice,
        branch_label=branch_label,
        version_path=version_path,
        rev_id=rev_id,
        depends_on=depends_on,
    )
    
    if revision is None and autogenerate:
        log.info("No changes detected in models")
        return None
    
    if revision:
        migration_file = Path(version_path) / f"{revision.revision}.py"
        log.info(f"Created migration: {migration_file}")
        return str(migration_file)
    
    return None

async def upgrade_database(
    revision: str = "head",
    sql: bool = False,
    tag: Optional[str] = None,
) -> None:
    """Upgrade the database to a later version.
    
    Args:
        revision: Target revision or 'head' for the latest revision.
        sql: If True, generate SQL script instead of running migrations.
        tag: Optional arbitrary 'tag' that can be intercepted by custom env.py scripts.
    """
    config = get_alembic_config()
    
    # Get current revision
    current_rev = await get_database_version(engine)
    log.info(f"Current database revision: {current_rev or 'None'}")
    
    # Run upgrade
    command.upgrade(config, revision, sql=sql, tag=tag)
    
    # Get new revision
    new_rev = await get_database_version(engine)
    log.info(f"Database upgraded to revision: {new_rev}")

async def downgrade_database(
    revision: str = "-1",
    sql: bool = False,
    tag: Optional[str] = None,
) -> None:
    """Revert the database to a previous version.
    
    Args:
        revision: Target revision or relative revision (e.g., '-1' for previous).
        sql: If True, generate SQL script instead of running migrations.
        tag: Optional arbitrary 'tag' that can be intercepted by custom env.py scripts.
    """
    config = get_alembic_config()
    
    # Get current revision
    current_rev = await get_database_version(engine)
    log.info(f"Current database revision: {current_rev or 'None'}")
    
    # Run downgrade
    command.downgrade(config, revision, sql=sql, tag=tag)
    
    # Get new revision
    new_rev = await get_database_version(engine)
    log.info(f"Database downgraded to revision: {new_rev}")

async def check_migrations() -> bool:
    """Check if there are any pending migrations.
    
    Returns:
        bool: True if database is up to date, False otherwise.
    """
    config = get_alembic_config()
    script = ScriptDirectory.from_config(config)
    
    # Get current revision
    current_rev = await get_database_version(engine)
    
    if current_rev is None:
        log.warning("No migrations applied yet")
        return False
    
    # Get head revision
    head_rev = script.get_current_head()
    
    if head_rev is None:
        log.error("No migration scripts found")
        return False
    
    # Check if database is up to date
    if current_rev != head_rev:
        log.warning(f"Database is not up to date. Current: {current_rev}, Head: {head_rev}")
        return False
    
    log.info("Database is up to date")
    return True

async def create_initial_migration() -> Optional[str]:
    """Create the initial database migration.
    
    Returns:
        Path to the created migration file, or None if no changes were detected.
    """
    # Initialize migrations if needed
    await init_migrations()
    
    # Create initial migration
    return await create_migration(
        message="Initial migration",
        autogenerate=True,
        head="base"
    )

async def migrate_database() -> None:
    """Run all pending migrations."""
    # Initialize migrations if needed
    await init_migrations()
    
    # Check current status
    is_up_to_date = await check_migrations()
    
    if not is_up_to_date:
        # Run migrations
        await upgrade_database("head")
    else:
        log.info("Database is already up to date")
