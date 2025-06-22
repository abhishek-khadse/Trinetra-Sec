"""
Tests package.

This package contains all the test cases for the application.
"""
import os
import sys
import pytest
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment variables
os.environ['ENV'] = 'test'
os.environ['TESTING'] = 'true'

# Import test modules here
# from . import test_security
# from . import test_models
# from . import test_api

__all__ = [
    # Add test modules here
]
