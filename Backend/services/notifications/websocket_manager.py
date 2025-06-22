"""
WebSocket Manager for Real-time Notifications

This module provides a WebSocket manager for handling real-time communication
with clients, including threat notifications and scan status updates.
"""
import json
import asyncio
import logging
from typing import Dict, List, Optional, Callable, Any, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid

from fastapi import WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field

from core.security.jwt import verify_jwt_token
from config import settings

# Configure logger
logger = logging.getLogger("websockets")
logger.setLevel(logging.INFO)

# Configure console handler for development
if settings.DEBUG:
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    logger.addHandler(console_handler)

class ConnectionType(str, Enum):
    """Types of WebSocket connections."""
    USER = "user"
    SCAN = "scan"
    DASHBOARD = "dashboard"
    ADMIN = "admin"

class NotificationType(str, Enum):
    """Types of notifications that can be sent over WebSocket."""
    # System notifications
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PING = "ping"
    PONG = "pong"
    
    # Scan status updates
    SCAN_STARTED = "scan_started"
    SCAN_PROGRESS = "scan_progress"
    SCAN_COMPLETED = "scan_completed"
    SCAN_FAILED = "scan_failed"
    
    # Threat notifications
    THREAT_DETECTED = "threat_detected"
    THREAT_MITIGATED = "threat_mitigated"
    
    # User notifications
    USER_JOINED = "user_joined"
    USER_LEFT = "user_left"
    
    # System alerts
    SYSTEM_ALERT = "system_alert"
    MAINTENANCE_NOTICE = "maintenance_notice"

@dataclass
class WebSocketClient:
    """Represents a connected WebSocket client."""
    websocket: WebSocket
    client_id: str
    user_id: Optional[str] = None
    connection_type: Optional[ConnectionType] = None
    scan_id: Optional[str] = None
    groups: Set[str] = field(default_factory=set)
    
    async def send_json(self, data: Dict[str, Any]) -> bool:
        """Send JSON data to the client."""
        try:
            await self.websocket.send_json(data)
            return True
        except Exception as e:
            logger.error(f"Failed to send message to client {self.client_id}: {str(e)}")
            return False
    
    async def close(self, code: int = status.WS_1000_NORMAL_CLOSURE, reason: str = None):
        """Close the WebSocket connection."""
        try:
            await self.websocket.close(code=code, reason=reason)
        except Exception as e:
            logger.error(f"Error closing WebSocket connection {self.client_id}: {str(e)}")

class Notification(BaseModel):
    """Base model for WebSocket notifications."""
    type: NotificationType
    data: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
    
    def dict(self, **kwargs) -> Dict[str, Any]:
        """Convert the notification to a dictionary."""
        data = super().dict(**kwargs)
        data["timestamp"] = self.timestamp.isoformat()
        return data

class WebSocketManager:
    """Manages WebSocket connections and message broadcasting."""
    
    def __init__(self):
        """Initialize the WebSocket manager."""
        self.active_connections: Dict[str, WebSocketClient] = {}
        self.user_connections: Dict[str, Set[str]] = {}
        self.scan_connections: Dict[str, Set[str]] = {}
        self.group_connections: Dict[str, Set[str]] = {}
        self.lock = asyncio.Lock()
    
    async def connect(
        self,
        websocket: WebSocket,
        client_id: str,
        user_id: Optional[str] = None,
        connection_type: Optional[ConnectionType] = None,
        scan_id: Optional[str] = None,
        groups: Optional[List[str]] = None
    ) -> WebSocketClient:
        """
        Accept a new WebSocket connection and register the client.
        
        Args:
            websocket: The WebSocket connection
            client_id: Unique identifier for the client
            user_id: Optional user ID if authenticated
            connection_type: Type of connection
            scan_id: Optional scan ID if related to a scan
            groups: List of groups the client belongs to
            
        Returns:
            WebSocketClient: The registered client
        """
        # Accept the WebSocket connection
        await websocket.accept()
        
        # Create a new client
        client = WebSocketClient(
            websocket=websocket,
            client_id=client_id,
            user_id=user_id,
            connection_type=connection_type,
            scan_id=scan_id,
            groups=set(groups or [])
        )
        
        async with self.lock:
            # Register the connection
            self.active_connections[client_id] = client
            
            # Register user connections if user_id is provided
            if user_id:
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = set()
                self.user_connections[user_id].add(client_id)
            
            # Register scan connections if scan_id is provided
            if scan_id:
                if scan_id not in self.scan_connections:
                    self.scan_connections[scan_id] = set()
                self.scan_connections[scan_id].add(client_id)
            
            # Register group connections
            for group in client.groups:
                if group not in self.group_connections:
                    self.group_connections[group] = set()
                self.group_connections[group].add(client_id)
        
        logger.info(f"Client connected: {client_id} (user: {user_id or 'anonymous'})")
        
        # Send connection confirmation
        await client.send_json(Notification(
            type=NotificationType.CONNECTED,
            data={"client_id": client_id}
        ).dict())
        
        # Notify about the new connection (except to the new client)
        if user_id:
            await self.broadcast(
                notification=Notification(
                    type=NotificationType.USER_JOINED,
                    data={"user_id": user_id, "client_id": client_id}
                ),
                exclude_client_ids={client_id}
            )
        
        return client
    
    async def disconnect(self, client_id: str, code: int = status.WS_1000_NORMAL_CLOSURE, reason: str = None):
        """
        Disconnect a client and clean up references.
        
        Args:
            client_id: The ID of the client to disconnect
            code: WebSocket close code
            reason: Reason for disconnection
        """
        client = self.active_connections.get(client_id)
        if not client:
            return
        
        user_id = client.user_id
        
        # Close the WebSocket connection
        await client.close(code=code, reason=reason)
        
        async with self.lock:
            # Remove from active connections
            self.active_connections.pop(client_id, None)
            
            # Remove from user connections
            if user_id and user_id in self.user_connections:
                self.user_connections[user_id].discard(client_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            # Remove from scan connections
            if client.scan_id and client.scan_id in self.scan_connections:
                self.scan_connections[client.scan_id].discard(client_id)
                if not self.scan_connections[client.scan_id]:
                    del self.scan_connections[client.scan_id]
            
            # Remove from group connections
            for group in client.groups:
                if group in self.group_connections:
                    self.group_connections[group].discard(client_id)
                    if not self.group_connections[group]:
                        del self.group_connections[group]
        
        logger.info(f"Client disconnected: {client_id} (user: {user_id or 'anonymous'})")
        
        # Notify about the disconnection
        if user_id:
            await self.broadcast(
                notification=Notification(
                    type=NotificationType.USER_LEFT,
                    data={"user_id": user_id, "client_id": client_id}
                )
            )
    
    async def send_to_client(self, client_id: str, notification: Notification) -> bool:
        """
        Send a notification to a specific client.
        
        Args:
            client_id: The ID of the client to send to
            notification: The notification to send
            
        Returns:
            bool: True if the message was sent successfully, False otherwise
        """
        client = self.active_connections.get(client_id)
        if not client:
            return False
        
        return await client.send_json(notification.dict())
    
    async def send_to_user(self, user_id: str, notification: Notification) -> List[bool]:
        """
        Send a notification to all connections for a specific user.
        
        Args:
            user_id: The ID of the user to send to
            notification: The notification to send
            
        Returns:
            List[bool]: List of send results (True for success, False for failure)
        """
        results = []
        
        # Get a copy of client IDs to avoid modification during iteration
        client_ids = list(self.user_connections.get(user_id, set()))
        
        for client_id in client_ids:
            result = await self.send_to_client(client_id, notification)
            results.append(result)
        
        return results
    
    async def send_to_scan(self, scan_id: str, notification: Notification) -> List[bool]:
        """
        Send a notification to all connections related to a specific scan.
        
        Args:
            scan_id: The ID of the scan
            notification: The notification to send
            
        Returns:
            List[bool]: List of send results (True for success, False for failure)
        """
        results = []
        
        # Get a copy of client IDs to avoid modification during iteration
        client_ids = list(self.scan_connections.get(scan_id, set()))
        
        for client_id in client_ids:
            result = await self.send_to_client(client_id, notification)
            results.append(result)
        
        return results
    
    async def send_to_group(self, group: str, notification: Notification) -> List[bool]:
        """
        Send a notification to all connections in a specific group.
        
        Args:
            group: The name of the group
            notification: The notification to send
            
        Returns:
            List[bool]: List of send results (True for success, False for failure)
        """
        results = []
        
        # Get a copy of client IDs to avoid modification during iteration
        client_ids = list(self.group_connections.get(group, set()))
        
        for client_id in client_ids:
            result = await self.send_to_client(client_id, notification)
            results.append(result)
        
        return results
    
    async def broadcast(
        self,
        notification: Notification,
        exclude_client_ids: Optional[Set[str]] = None,
        exclude_user_ids: Optional[Set[str]] = None
    ) -> Dict[str, List[bool]]:
        """
        Broadcast a notification to all connected clients.
        
        Args:
            notification: The notification to broadcast
            exclude_client_ids: Set of client IDs to exclude
            exclude_user_ids: Set of user IDs to exclude
            
        Returns:
            Dict[str, List[bool]]: Dictionary of send results by client ID
        """
        results = {}
        exclude_client_ids = exclude_client_ids or set()
        exclude_user_ids = exclude_user_ids or set()
        
        # Get a copy of client IDs to avoid modification during iteration
        client_ids = list(self.active_connections.keys())
        
        for client_id in client_ids:
            client = self.active_connections.get(client_id)
            if not client:
                continue
                
            # Skip excluded clients and users
            if client_id in exclude_client_ids:
                continue
                
            if client.user_id and client.user_id in exclude_user_ids:
                continue
            
            # Send the notification
            result = await client.send_json(notification.dict())
            results[client_id] = result
        
        return results
    
    async def handle_client(
        self,
        websocket: WebSocket,
        client_id: str,
        user_id: Optional[str] = None,
        connection_type: Optional[ConnectionType] = None,
        scan_id: Optional[str] = None,
        groups: Optional[List[str]] = None
    ) -> None:
        """
        Handle a WebSocket client connection.
        
        Args:
            websocket: The WebSocket connection
            client_id: Unique identifier for the client
            user_id: Optional user ID if authenticated
            connection_type: Type of connection
            scan_id: Optional scan ID if related to a scan
            groups: List of groups the client belongs to
        """
        client = await self.connect(
            websocket=websocket,
            client_id=client_id,
            user_id=user_id,
            connection_type=connection_type,
            scan_id=scan_id,
            groups=groups or []
        )
        
        try:
            while True:
                # Wait for a message from the client
                message = await websocket.receive_text()
                
                try:
                    data = json.loads(message)
                    
                    # Handle ping/pong
                    if data.get("type") == NotificationType.PING:
                        await client.send_json(Notification(
                            type=NotificationType.PONG,
                            data={"timestamp": datetime.utcnow().isoformat()}
                        ).dict())
                    
                    # Handle other message types here
                    # Example: Handle subscription to specific channels
                    
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from client {client_id}")
                except Exception as e:
                    logger.error(f"Error processing message from client {client_id}: {str(e)}")
                    
        except WebSocketDisconnect:
            logger.info(f"Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        finally:
            await self.disconnect(client_id)
    
    async def authenticate_connection(
        self,
        websocket: WebSocket,
        token: Optional[str] = None,
        client_id: Optional[str] = None,
        connection_type: Optional[ConnectionType] = None,
        scan_id: Optional[str] = None,
        groups: Optional[List[str]] = None
    ) -> WebSocketClient:
        """
        Authenticate a WebSocket connection using JWT token.
        
        Args:
            websocket: The WebSocket connection
            token: JWT token for authentication
            client_id: Optional custom client ID
            connection_type: Type of connection
            scan_id: Optional scan ID if related to a scan
            groups: List of groups the client belongs to
            
        Returns:
            WebSocketClient: The authenticated client
            
        Raises:
            WebSocketDisconnect: If authentication fails
        """
        client_id = client_id or str(uuid.uuid4())
        
        if not token:
            # Allow unauthenticated connections with limited access
            return await self.connect(
                websocket=websocket,
                client_id=client_id,
                connection_type=connection_type,
                scan_id=scan_id,
                groups=groups or []
            )
        
        try:
            # Verify the JWT token
            payload = verify_jwt_token(token)
            
            # Connect the client with user information
            return await self.connect(
                websocket=websocket,
                client_id=client_id,
                user_id=payload.sub,
                connection_type=connection_type,
                scan_id=scan_id,
                groups=groups or []
            )
            
        except Exception as e:
            logger.warning(f"WebSocket authentication failed: {str(e)}")
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Authentication failed"
            )
            raise WebSocketDisconnect()

# Global WebSocket manager instance
websocket_manager = WebSocketManager()

# Example usage:
# @app.websocket("/ws/{client_id}")
# async def websocket_endpoint(websocket: WebSocket, client_id: str, token: str = None):
#     await websocket_manager.authenticate_connection(
#         websocket=websocket,
#         token=token,
#         client_id=client_id,
#         connection_type=ConnectionType.USER
#     )
