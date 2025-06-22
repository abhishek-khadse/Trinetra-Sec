"""
Logging configuration and utilities for the application.
"""
import logging
import logging.config
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional, Union
import json
import time
from datetime import datetime, timezone
import traceback

from config import settings

# Ensure log directory exists
os.makedirs("logs", exist_ok=True)

def get_logger(name: str = None) -> logging.Logger:
    """Get a configured logger instance.
    
    Args:
        name: Logger name. If None, returns the root logger.
        
    Returns:
        Configured logger instance.
    """
    return logging.getLogger(name)

class JsonFormatter(logging.Formatter):
    """Custom formatter that outputs JSON strings."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as a JSON string."""
        log_record = {
            'timestamp': datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            'level': record.levelname,
            'name': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'process': record.process,
            'thread': record.thread,
            'thread_name': record.threadName,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra') and isinstance(record.extra, dict):
            log_record.update(record.extra)
        
        return json.dumps(log_record, ensure_ascii=False)

class ContextFilter(logging.Filter):
    """Add contextual information to log records."""
    
    def __init__(self, context: Optional[Dict[str, Any]] = None):
        """Initialize the filter with optional context."""
        super().__init__()
        self.context = context or {}
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add context to the log record."""
        for key, value in self.context.items():
            setattr(record, key, value)
        return True

def configure_logging(
    log_level: str = None,
    log_file: str = None,
    json_format: bool = False,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
) -> None:
    """Configure logging for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        log_file: Path to the log file. If None, logs to stderr.
        json_format: Whether to use JSON format for logs.
        max_bytes: Maximum log file size in bytes before rotation.
        backup_count: Number of backup log files to keep.
    """
    if log_level is None:
        log_level = settings.LOG_LEVEL
    
    if log_file is None:
        log_file = f"logs/{settings.ENV}.log"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    # Convert log level string to level
    level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatter
    if json_format:
        formatter = JsonFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S%z'
        )
    
    # Console handler (stderr)
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler with rotation
    if log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Configure third-party loggers
    logging.getLogger('uvicorn').handlers = []
    logging.getLogger('uvicorn').propagate = True
    logging.getLogger('uvicorn.error').propagate = True
    logging.getLogger('fastapi').handlers = []
    logging.getLogger('fastapi').propagate = True
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.orm').setLevel(logging.WARNING)
    logging.getLogger('aiosqlite').setLevel(logging.WARNING)
    logging.getLogger('aiohttp').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)

class RequestIdFilter(logging.Filter):
    """Add request ID to log records."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add request ID to the log record if available."""
        if not hasattr(record, 'request_id'):
            record.request_id = 'none'
        return True

class RequestLogger:
    """Middleware to log HTTP requests and responses."""
    
    def __init__(self, app, logger: logging.Logger = None):
        """Initialize the middleware."""
        self.app = app
        self.logger = logger or get_logger('http')
    
    async def __call__(self, scope, receive, send):
        """Log the request and response."""
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        
        # Generate request ID
        request_id = os.urandom(8).hex()
        
        # Add request ID to log records
        context_filter = ContextFilter({'request_id': request_id})
        self.logger.addFilter(context_filter)
        
        # Log request
        request_start_time = time.time()
        request = scope.get('http', {})
        
        self.logger.info(
            'Request started',
            extra={
                'request_id': request_id,
                'method': request.get('method', 'UNKNOWN'),
                'path': scope.get('path', '/'),
                'client': f"{scope.get('client', ('', ''))[0]}:{scope.get('client', ('', ''))[1]}",
                'scheme': scope.get('scheme', 'http'),
                'query_string': scope.get('query_string', b'').decode('utf-8', 'replace'),
                'headers': dict(scope.get('headers', [])),
            }
        )
        
        # Process the request
        try:
            # Create a send wrapper to capture the response status
            async def send_wrapper(message):
                if message['type'] == 'http.response.start':
                    # Log response
                    process_time = time.time() - request_start_time
                    
                    self.logger.info(
                        'Request completed',
                        extra={
                            'request_id': request_id,
                            'status_code': message.get('status', 0),
                            'process_time': f"{process_time:.4f}s",
                            'response_headers': dict(message.get('headers', [])),
                        }
                    )
                
                await send(message)
            
            return await self.app(scope, receive, send_wrapper)
        except Exception as e:
            # Log unhandled exceptions
            self.logger.error(
                'Request failed',
                exc_info=e,
                extra={
                    'request_id': request_id,
                    'error': str(e),
                    'traceback': traceback.format_exc(),
                }
            )
            raise
        finally:
            # Clean up the filter
            self.logger.removeFilter(context_filter)

def log_exception(
    logger: logging.Logger,
    message: str,
    exc: Exception,
    extra: Optional[Dict[str, Any]] = None,
    level: str = 'error'
) -> None:
    """Log an exception with context.
    
    Args:
        logger: Logger instance.
        message: Log message.
        exc: Exception instance.
        extra: Additional context to include in the log.
        level: Log level ('debug', 'info', 'warning', 'error', 'critical').
    """
    extra = extra or {}
    extra.update({
        'exception_type': exc.__class__.__name__,
        'exception_message': str(exc),
        'exception_module': exc.__class__.__module__,
        'traceback': traceback.format_exc(),
    })
    
    log_method = getattr(logger, level.lower(), logger.error)
    log_method(message, extra=extra)

# Configure logging on import
configure_logging()

# Common loggers
logger = get_logger(__name__)
http_logger = get_logger('http')
db_logger = get_logger('database')
auth_logger = get_logger('auth')
api_logger = get_logger('api')
ml_logger = get_logger('ml')
