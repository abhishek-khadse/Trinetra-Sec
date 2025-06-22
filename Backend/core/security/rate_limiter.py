# core/security/rate_limiter.py
import time
from typing import Dict, Tuple

from fastapi import HTTPException, Request, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from core.utils.logger import logger

# In-memory storage for failed login attempts. In production, use Redis or a DB.
# Structure: {ip_address: (failed_attempts, lock_until_timestamp)}
failed_login_attempts: Dict[str, Tuple[int, float]] = {}

# --- Rate Limits --- #
# Login endpoint: 10 requests per minute
# General API: 100 requests per hour
limiter = Limiter(key_func=get_remote_address, default_limits=["100/hour"])

async def handle_rate_limit_exceeded(request: Request, exc: RateLimitExceeded):
    """Custom handler for when a rate limit is exceeded."""
    # Check if this is a failed login attempt
    if "/auth/login" in request.url.path:
        ip = get_remote_address(request)
        now = time.time()

        attempts, lock_until = failed_login_attempts.get(ip, (0, 0))

        # If already locked, just refresh the lockout time
        if now < lock_until:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked due to too many failed login attempts. Try again in {int((lock_until - now) / 60)} minutes.",
            )

        attempts += 1

        if attempts >= 5:
            # Lock account for 15 minutes
            lock_until = now + 900
            failed_login_attempts[ip] = (attempts, lock_until)
            logger.warning(f"Brute-force protection triggered for IP {ip}. Account locked for 15 minutes.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account locked for 15 minutes due to too many failed login attempts.",
            )
        else:
            failed_login_attempts[ip] = (attempts, 0)
            logger.info(f"Failed login attempt {attempts}/5 for IP {ip}.")

    # For all other rate limit breaches, use the default handler
    return await _rate_limit_exceeded_handler(request, exc)

def setup_rate_limiter(app):
    """Add the rate limiter and exception handler to the FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, handle_rate_limit_exceeded)
