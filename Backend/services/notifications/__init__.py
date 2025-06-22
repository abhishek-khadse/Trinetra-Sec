"""
Notifications package.

This package contains notification services like WebSocket handlers.
"""
from .websocket import WebSocketManager, websocket_manager, notify_threat_detection, notify_scan_complete

__all__ = [
    'WebSocketManager',
    'websocket_manager',
    'notify_threat_detection',
    'notify_scan_complete'
]
