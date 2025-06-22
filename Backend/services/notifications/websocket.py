from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import asyncio
import json
from datetime import datetime

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.channels: Dict[str, List[str]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
    async def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            # Remove from all channels
            for channel, clients in self.channels.items():
                if client_id in clients:
                    clients.remove(client_id)

    async def subscribe(self, client_id: str, channel: str):
        if channel not in self.channels:
            self.channels[channel] = []
        if client_id not in self.channels[channel]:
            self.channels[channel].append(client_id)

    async def unsubscribe(self, client_id: str, channel: str):
        if channel in self.channels and client_id in self.channels[channel]:
            self.channels[channel].remove(client_id)

    async def send_message(self, client_id: str, message: Dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to {client_id}: {e}")
                await self.disconnect(client_id)

    async def broadcast(self, channel: str, message: Dict):
        if channel in self.channels:
            for client_id in self.channels[channel]:
                await self.send_message(client_id, message)

# Global WebSocket manager instance
websocket_manager = WebSocketManager()

async def notify_threat_detection(threat_data: Dict):
    """Send a threat detection notification to all subscribed clients"""
    message = {
        "type": "threat_detected",
        "timestamp": datetime.utcnow().isoformat(),
        "data": threat_data
    }
    await websocket_manager.broadcast("threats", message)

async def notify_scan_complete(scan_id: str, status: str, results: Dict):
    """Send a scan completion notification to the client who initiated the scan"""
    message = {
        "type": "scan_complete",
        "scan_id": scan_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }
    # Assuming scan notifications are sent to a channel named after the scan_id
    await websocket_manager.broadcast(f"scan_{scan_id}", message)
