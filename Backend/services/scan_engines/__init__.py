"""
Scan Engines package.

This package contains various security scanning engines.
"""
from typing import Optional, Dict, Any

class BaseScanner:
    """Base class for all scan engines."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
    
    async def scan(self, target: str, **kwargs) -> Dict[str, Any]:
        """Perform a scan on the target."""
        raise NotImplementedError("Subclasses must implement this method")
    
    async def get_status(self, scan_id: str) -> Dict[str, Any]:
        """Get the status of a scan."""
        raise NotImplementedError("Subclasses must implement this method")


# Import specific scanners here
# from .malware_scanner import MalwareScanner
# from .vulnerability_scanner import VulnerabilityScanner
