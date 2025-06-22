#!/usr/bin/env python3
"""
Initialize the database with initial data.

This script creates the database tables and adds an initial admin user.
"""
import asyncio
import getpass
import os
import sys
from pathlib import Path
from typing import Optional

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.absolute()))

import bcrypt
from core.database import (
    get_db,
    init_db,
    close_db,
    User,
    UserRole,
    UserStatus,
)
from core.utils.logger import logger as log

# Configure logging
log.setLevel("INFO")


async def create_admin_user(email: str, password: str) -> Optional[User]:
    """Create an admin user.
    
    Args:
        email: Admin email
        password: Admin password
        
    Returns:
        The created User object or None if creation failed
    """
    async for db in get_db():
        try:
            # Check if admin user already exists
            existing_admin = await User.get(db, email=email, include_deleted=True)
            if existing_admin:
                log.warning(f"Admin user with email {email} already exists")
                return None
            
            # Hash the password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create admin user
            admin = User(
                email=email,
                hashed_password=hashed_password,
                first_name="Admin",
                last_name="User",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                email_verified_at=datetime.now(timezone.utc),
            )
            
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            
            log.info(f"Created admin user with email: {email}")
            return admin
            
        except Exception as e:
            await db.rollback()
            log.error(f"Error creating admin user: {str(e)}", exc_info=True)
            return None


async def main() -> int:
    """Main entry point.
    
    Returns:
        int: Exit code (0 for success, non-zero for error)
    """
    print("\n=== Database Initialization ===\n")
    
    # Initialize database
    try:
        log.info("Initializing database...")
        await init_db()
        log.info("Database initialized successfully")
    except Exception as e:
        log.error(f"Failed to initialize database: {str(e)}", exc_info=True)
        return 1
    
    # Create admin user
    print("\n=== Create Admin User ===\n")
    
    email = input("Admin email [admin@example.com]: ").strip() or "admin@example.com"
    
    while True:
        password = getpass.getpass("Admin password: ").strip()
        if not password:
            print("Password cannot be empty. Please try again.")
            continue
            
        confirm_password = getpass.getpass("Confirm password: ").strip()
        
        if password != confirm_password:
            print("Passwords do not match. Please try again.")
            continue
            
        if len(password) < 8:
            print("Password must be at least 8 characters long. Please try again.")
            continue
            
        break
    
    try:
        admin = await create_admin_user(email, password)
        if admin:
            log.info("Admin user created successfully")
            print("\n=== Setup Complete ===\n")
            print("You can now log in with the following credentials:")
            print(f"Email: {email}")
            print("Password: [the password you entered]")
            print("\nPlease change your password after first login.")
            return 0
        else:
            log.error("Failed to create admin user")
            return 1
    except Exception as e:
        log.error(f"Failed to create admin user: {str(e)}", exc_info=True)
        return 1
    finally:
        await close_db()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
