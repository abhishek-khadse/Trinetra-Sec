""
Logging configuration for the application.
"""
import logging
import logging.config
import os
from pathlib import Path
from typing import Optional

from pythonjsonlogger import jsonlogger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a configured logger instance.
    
    Args:
        name: The name of the logger. If None, returns the root logger.
        
    Returns:
        A configured logger instance.
    """
    return logging.getLogger(name)


def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None) -> None:
    """
    Set up logging configuration.
    
    Args:
        log_level: The log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        log_file: Path to the log file. If None, logs to console only.
    """
    # Create logs directory if it doesn't exist
    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir:
            Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    log_handlers = {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
            'stream': 'ext://sys.stdout',
        }
    }
    
    if log_file:
        log_handlers['file'] = {
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'json',
            'filename': log_file,
            'maxBytes': 10 * 1024 * 1024,  # 10MB
            'backupCount': 5,
            'encoding': 'utf8',
        }
    
    log_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
                'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
                'datefmt': '%Y-%m-%dT%H:%M:%SZ',
            },
        },
        'handlers': log_handlers,
        'loggers': {
            '': {  # root logger
                'handlers': list(log_handlers.keys()),
                'level': log_level,
                'propagate': True,
            },
        },
    }
    
    logging.config.dictConfig(log_config)
    
    # Set log level for specific loggers
    logging.getLogger('uvicorn').setLevel('WARNING')
    logging.getLogger('uvicorn.access').handlers = logging.getLogger().handlers
