from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from core.security.rate_limiter import setup_rate_limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Application lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    # Startup
    logger.info("Starting TrinetraSec Backend...")
    logger.info(f"Environment: {os.getenv('ENV', 'development')}")
    
    # Initialize services here
    try:
        # Ensure required directories exist
        os.makedirs('logs', exist_ok=True)
        os.makedirs('data/uploads', exist_ok=True)
        logger.info("Application directories initialized")
    except Exception as e:
        logger.error(f"Failed to initialize application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down TrinetraSec Backend...")

# Load environment variables
load_dotenv()

# Initialize security
security = HTTPBearer()

class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    authjwt_access_token_expires: int = 86400  # 24 hours

@AuthJWT.load_config
async def get_config():
    return Settings()

# Create the FastAPI app with lifespan management
app = FastAPI(
    title="TrinetraSec Backend",
    description="Advanced Cybersecurity Platform Backend",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# Setup rate limiting
setup_rate_limiter(app)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their responses."""
    request_id = str(uuid.uuid4())
    logger.info(f"Request: {request.method} {request.url} - ID: {request_id}")
    
    try:
        response = await call_next(request)
        logger.info(f"Response: {request.method} {request.url} - Status: {response.status_code} - ID: {request_id}")
        return response
    except Exception as e:
        logger.error(f"Error in {request.method} {request.url}: {str(e)} - ID: {request_id}", exc_info=True)
        raise

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

# Import routes
# New production-grade feature routes
from app.routes.assistant import ask as assistant_ask_router
from app.routes.dashboard import stats as dashboard_stats
from app.routes.modules import reports
from app.routes.ws import threats as ws_threats

# Original application routes
from app.routes.modules import (common, dependencies, nmap, nuclei, whois)
from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.audit import router as audit_router
from routes.learn import router as learn_router
from routes.knowledge import router as knowledge_router
# The following original routers are disabled as they are replaced by new production-grade features
# from routes.dashboard import router as dashboard_router
# from routes.assistant import router as assistant_router
# from routes.websocket import router as websocket_router


# Include routers with proper ordering (more specific routes first)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(learn_router, prefix="/api/v1/learn", tags=["learn"])
app.include_router(audit_router, prefix="/api/v1/audit", tags=["audit"])
app.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["knowledge"])

# Module Routers
app.include_router(common.router, prefix="/api/v1/scans", tags=["scans"])
app.include_router(dependencies.router, prefix="/api/v1/dependencies", tags=["dependencies"])
app.include_router(nmap.router, prefix="/api/v1/nmap", tags=["nmap"])
app.include_router(nuclei.router, prefix="/api/v1/nuclei", tags=["nuclei"])
app.include_router(whois.router, prefix="/api/v1/whois", tags=["whois"])

# Production-Grade Feature Routers
app.include_router(dashboard_stats.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(ws_threats.router, prefix="/api/v1/ws", tags=["websockets"])
app.include_router(assistant_ask_router, prefix="/api/v1/assistant", tags=["assistant"])
app.include_router(reports.router, prefix="/api/v1/modules", tags=["reports"])

# The following original routers are disabled as they are replaced by new production-grade features
# app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
# app.include_router(assistant_router, prefix="/api/v1/assistant", tags=["assistant"])
# app.include_router(websocket_router, prefix="/api/v1/ws", tags=["websocket"])

# Health check endpoint
@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected",  # Add actual database check
            "cache": "connected",    # Add actual cache check
            "storage": "connected"   # Add actual storage check
        }
    }

# Version and system info endpoint
@app.get("/api/v1/info", tags=["info"])
async def get_system_info():
    """Get system information and version details."""
    import platform
    import psutil
    from importlib.metadata import version
    
    try:
        # Get Python and package versions
        python_version = platform.python_version()
        fastapi_version = version('fastapi')
        
        # Get system info
        system_info = {
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "cpu_cores": psutil.cpu_count(logical=True),
            "memory_total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
            "disk_usage": {}
        }
        
        # Get disk usage
        for part in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(part.mountpoint)
                system_info["disk_usage"][part.mountpoint] = {
                    "total_gb": round(usage.total / (1024 ** 3), 2),
                    "used_gb": round(usage.used / (1024 ** 3), 2),
                    "free_gb": round(usage.free / (1024 ** 3), 2),
                    "percent_used": usage.percent
                }
            except Exception as e:
                logger.warning(f"Could not read disk usage for {part.mountpoint}: {str(e)}")
        
        return {
            "application": {
                "name": "TrinetraSec Backend",
                "version": "1.0.0",
                "environment": os.getenv("ENV", "development"),
                "startup_time": app_start_time.isoformat() if 'app_start_time' in globals() else None
            },
            "dependencies": {
                "python": python_version,
                "fastapi": fastapi_version,
                # Add other important dependencies
            },
            "system": system_info,
            "services": {
                "database": {
                    "status": "connected",
                    "type": os.getenv("DB_TYPE", "postgresql")
                },
                "cache": {
                    "status": "connected",
                    "type": os.getenv("CACHE_TYPE", "redis")
                },
                "storage": {
                    "status": "connected",
                    "type": os.getenv("STORAGE_TYPE", "local")
                },
                "models": {
                    "network_ids": "loaded",
                    "ddos_detector": "loaded",
                    "content_analyzer": "loaded",
                    "phishing_detector": "loaded",
                    "ai_misuse_detector": "loaded"
                }
            },
            "api": {
                "base_path": "/api/v1",
                "documentation": "/api/v1/docs",
                "openapi_spec": "/api/v1/openapi.json"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve system information: {str(e)}"
        )

# Store application start time
app_start_time = datetime.utcnow()

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent error response format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "path": request.url.path,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions with a generic error response."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "path": request.url.path,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

# Add CORS middleware with more secure defaults
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "X-Total-Count"],
    max_age=600  # 10 minutes
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    
    # Remove server header
    if "server" in response.headers:
        del response.headers["server"]
    
    return response
