# app/routes/ws/threats.py
import asyncio
from typing import Dict, List
from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    Query,
    HTTPException,
    status,
)

from auth.services.user_service import get_current_user_from_token
from core.database.models import User
from core.event_dispatcher import event_dispatcher
from core.utils.logger import logger

router = APIRouter()

class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new connection."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected for user {user_id}")

    def disconnect(self, user_id: str):
        """Disconnect a websocket."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"WebSocket disconnected for user {user_id}")

    async def broadcast(self, message: Dict):
        """Send a message to all connected clients."""
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

async def threat_event_handler(event_type: str, data: Dict):
    """Callback to handle 'scan_complete' events and broadcast them."""
    logger.info(f"Broadcasting event: {event_type} with data: {data}")
    await manager.broadcast(
        {
            "event": event_type,
            "model": data.get("model"),
            "risk": data.get("risk_score"),
            "user_id": str(data.get("user_id")),
            "threat_level": data.get("threat_level"),
            "timestamp": data.get("timestamp"),
        }
    )

@router.on_event("startup")
async def startup_event():
    """Subscribe to scan completion events on startup."""
    event_dispatcher.subscribe("scan_complete", threat_event_handler)
    logger.info("Threat event handler subscribed to 'scan_complete' events.")

@router.on_event("shutdown")
async def shutdown_event():
    """Unsubscribe from events on shutdown."""
    event_dispatcher.unsubscribe("scan_complete", threat_event_handler)
    logger.info("Threat event handler unsubscribed.")

@router.websocket("/threats")
async def websocket_threat_feed(
    websocket: WebSocket,
    token: str = Query(..., description="JWT authentication token")
):
    """
    Establish a WebSocket connection for real-time threat feeds.

    Authenticates using a JWT token passed as a query parameter.
    """
    try:
        user: User = await get_current_user_from_token(token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(user.id)
    await manager.connect(websocket, user_id)

    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"Error in WebSocket for user {user_id}: {e}", exc_info=True)
        manager.disconnect(user_id)
