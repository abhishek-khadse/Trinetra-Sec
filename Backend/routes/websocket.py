"""
WebSocket Endpoints for Real-time Communication

This module provides WebSocket endpoints for real-time communication
between the server and clients, including threat notifications and
scan status updates.
"""
import json
import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

from services.notifications.websocket_manager import (
    WebSocketManager,
    websocket_manager,
    ConnectionType,
    NotificationType,
    Notification
)
from core.security.jwt import JWTBearer, requires_auth, get_current_user
from config import settings

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter()

class WebSocketAuthRequest(BaseModel):
    """Request model for WebSocket authentication."""
    token: Optional[str] = Field(
        None,
        description="JWT token for authentication (required for private channels)"
    )
    client_id: Optional[str] = Field(
        None,
        description="Optional custom client ID (auto-generated if not provided)"
    )
    connection_type: Optional[ConnectionType] = Field(
        ConnectionType.USER,
        description="Type of WebSocket connection"
    )
    scan_id: Optional[str] = Field(
        None,
        description="Optional scan ID for scan-specific connections"
    )
    groups: Optional[List[str]] = Field(
        None,
        description="List of groups to subscribe to"
    )

class WebSocketMessage(BaseModel):
    """Base model for WebSocket messages."""
    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(default_factory=dict, description="Message payload")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
    
    @validator('type')
    def validate_message_type(cls, v):
        """Validate that the message type is a valid NotificationType."""
        try:
            return NotificationType(v)
        except ValueError:
            # Allow custom message types
            return v

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT token for authentication"),
    client_id: Optional[str] = Query(None, description="Optional custom client ID"),
    connection_type: ConnectionType = Query(
        ConnectionType.USER,
        description="Type of WebSocket connection"
    ),
    scan_id: Optional[str] = Query(None, description="Optional scan ID for scan-specific connections"),
):
    """
    WebSocket endpoint for real-time communication.
    
    This endpoint establishes a WebSocket connection for receiving real-time
    notifications and updates. Clients can authenticate using a JWT token
    to access protected resources.
    
    Query Parameters:
    - token: JWT token for authentication (optional for public channels)
    - client_id: Optional custom client ID (auto-generated if not provided)
    - connection_type: Type of WebSocket connection (user, scan, dashboard, admin)
    - scan_id: Optional scan ID for scan-specific connections
    """
    try:
        # Accept the WebSocket connection
        await websocket.accept()
        
        # Generate a client ID if not provided
        client_id = client_id or f"client_{uuid.uuid4().hex[:8]}"
        
        # Authenticate the connection
        try:
            client = await websocket_manager.authenticate_connection(
                websocket=websocket,
                token=token,
                client_id=client_id,
                connection_type=connection_type,
                scan_id=scan_id,
                groups=["public"]  # All connections get the public group by default
            )
            
            logger.info(f"WebSocket connection established: {client_id} (user: {client.user_id or 'anonymous'})")
            
            # Handle incoming messages
            while True:
                try:
                    # Wait for a message from the client
                    message = await websocket.receive_text()
                    
                    try:
                        data = json.loads(message)
                        message_type = data.get("type")
                        
                        # Handle ping/pong
                        if message_type == NotificationType.PING:
                            await websocket_manager.send_to_client(
                                client_id=client_id,
                                notification=Notification(
                                    type=NotificationType.PONG,
                                    data={"timestamp": datetime.now(timezone.utc).isoformat()}
                                )
                            )
                        
                        # Handle subscription requests
                        elif message_type == "subscribe":
                            groups = data.get("data", {}).get("groups", [])
                            if isinstance(groups, list):
                                # Add the client to the requested groups
                                for group in groups:
                                    if group not in client.groups:
                                        client.groups.add(group)
                                        # Update group connections in the manager
                                        if group not in websocket_manager.group_connections:
                                            websocket_manager.group_connections[group] = set()
                                        websocket_manager.group_connections[group].add(client_id)
                                
                                await websocket_manager.send_to_client(
                                    client_id=client_id,
                                    notification=Notification(
                                        type="subscription_updated",
                                        data={"groups": list(client.groups)}
                                    )
                                )
                        
                        # Handle unsubscription requests
                        elif message_type == "unsubscribe":
                            groups = data.get("data", {}).get("groups", [])
                            if isinstance(groups, list):
                                # Remove the client from the specified groups
                                for group in groups:
                                    if group in client.groups:
                                        client.groups.remove(group)
                                        # Update group connections in the manager
                                        if group in websocket_manager.group_connections:
                                            websocket_manager.group_connections[group].discard(client_id)
                                            if not websocket_manager.group_connections[group]:
                                                del websocket_manager.group_connections[group]
                                
                                await websocket_manager.send_to_client(
                                    client_id=client_id,
                                    notification=Notification(
                                        type="subscription_updated",
                                        data={"groups": list(client.groups)}
                                    )
                                )
                        
                        # Echo the message back (for testing)
                        elif settings.DEBUG and message_type == "echo":
                            await websocket_manager.send_to_client(
                                client_id=client_id,
                                notification=Notification(
                                    type="echo",
                                    data={"message": data.get("data", {})}
                                )
                            )
                    
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON received from client {client_id}")
                        await websocket_manager.send_to_client(
                            client_id=client_id,
                            notification=Notification(
                                type=NotificationType.ERROR,
                                data={"message": "Invalid JSON format"}
                            )
                        )
                    
                except WebSocketDisconnect:
                    logger.info(f"Client {client_id} disconnected")
                    break
                except Exception as e:
                    logger.error(f"Error processing message from client {client_id}: {str(e)}", exc_info=True)
                    await websocket_manager.send_to_client(
                        client_id=client_id,
                        notification=Notification(
                            type=NotificationType.ERROR,
                            data={"message": "Internal server error"}
                        )
                    )
        
        except WebSocketDisconnect:
            # Client disconnected during authentication
            logger.info(f"Client {client_id} disconnected during authentication")
        
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
    
    finally:
        # Ensure the client is properly disconnected
        await websocket_manager.disconnect(client_id)
        logger.info(f"WebSocket connection closed: {client_id}")

@router.get(
    "/ws/connections",
    summary="Get active WebSocket connections",
    description="Retrieve information about active WebSocket connections.",
    dependencies=[Depends(requires_auth)]
)
async def get_connections(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    connection_type: Optional[ConnectionType] = Query(None, description="Filter by connection type"),
    scan_id: Optional[str] = Query(None, description="Filter by scan ID")
):
    """
    Get information about active WebSocket connections.
    
    This endpoint returns details about currently connected WebSocket clients,
    with optional filtering by user ID, connection type, or scan ID.
    """
    connections = []
    
    for client_id, client in websocket_manager.active_connections.items():
        # Apply filters
        if user_id and client.user_id != user_id:
            continue
            
        if connection_type and client.connection_type != connection_type:
            continue
            
        if scan_id and client.scan_id != scan_id:
            continue
        
        connections.append({
            "client_id": client_id,
            "user_id": client.user_id,
            "connection_type": client.connection_type,
            "scan_id": client.scan_id,
            "groups": list(client.groups) if client.groups else [],
            "connected_at": getattr(client, "connected_at", None)
        })
    
    return {
        "count": len(connections),
        "connections": connections
    }

@router.post(
    "/ws/notify",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Send a notification via WebSocket",
    description="Send a real-time notification to connected WebSocket clients.",
    dependencies=[Depends(requires_auth)]
)
async def send_notification(
    message: WebSocketMessage,
    target_type: str = Query("broadcast", regex="^(broadcast|user|group|client|scan)$"),
    target_id: Optional[str] = None,
    exclude_self: bool = Query(False, description="Exclude the sender from receiving the notification")
):
    """
    Send a real-time notification to connected WebSocket clients.
    
    This endpoint allows sending notifications to specific clients, users,
    groups, or broadcasting to all connected clients.
    """
    try:
        results = {}
        
        # Create a notification object
        notification = Notification(
            type=message.type,
            data=message.data,
            message_id=message.message_id
        )
        
        # Determine the target of the notification
        if target_type == "broadcast":
            # Broadcast to all connected clients
            results["sent_to"] = await websocket_manager.broadcast(notification)
            results["count"] = len(results["sent_to"])
            
        elif target_type == "user" and target_id:
            # Send to a specific user
            results["sent_to"] = await websocket_manager.send_to_user(target_id, notification)
            results["count"] = len(results["sent_to"])
            
        elif target_type == "group" and target_id:
            # Send to a specific group
            results["sent_to"] = await websocket_manager.send_to_group(target_id, notification)
            results["count"] = len(results["sent_to"])
            
        elif target_type == "client" and target_id:
            # Send to a specific client
            success = await websocket_manager.send_to_client(target_id, notification)
            results["sent_to"] = {target_id: success}
            results["count"] = 1 if success else 0
            
        elif target_type == "scan" and target_id:
            # Send to all clients connected to a specific scan
            results["sent_to"] = await websocket_manager.send_to_scan(target_id, notification)
            results["count"] = len(results["sent_to"])
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid target type or missing target ID"
            )
        
        return {
            "status": "success",
            "message_id": message.message_id,
            "target_type": target_type,
            "target_id": target_id,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notification: {str(e)}"
        )

# Example usage from other parts of the application:
# from services.notifications.websocket_manager import websocket_manager, Notification, NotificationType
# 
# # Send a notification to a specific user
# await websocket_manager.send_to_user(
#     user_id="user_123",
#     notification=Notification(
#         type=NotificationType.THREAT_DETECTED,
#         data={
#             "threat_id": "threat_456",
#             "severity": "high",
#             "message": "Malicious activity detected"
#         }
#     )
# )
# 
# # Broadcast a system message to all connected clients
# await websocket_manager.broadcast(
#     notification=Notification(
#         type=NotificationType.SYSTEM_ALERT,
#         data={
#             "message": "Scheduled maintenance in 10 minutes",
#             "start_time": "2023-01-01T12:00:00Z",
#             "duration_minutes": 30
#         }
#     )
# )
