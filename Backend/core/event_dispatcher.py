# core/event_dispatcher.py
from typing import Callable, Dict, List, Any
import asyncio

class EventDispatcher:
    """A simple async event dispatcher (pub/sub)."""

    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        """Subscribe a callback to an event type."""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        if callback not in self.subscribers[event_type]:
            self.subscribers[event_type].append(callback)

    def unsubscribe(self, event_type: str, callback: Callable):
        """Unsubscribe a callback from an event type."""
        if event_type in self.subscribers:
            try:
                self.subscribers[event_type].remove(callback)
            except ValueError:
                # Callback not in list
                pass

    async def publish(self, event_type: str, **data: Any):
        """Publish an event to all subscribers."""
        if event_type in self.subscribers:
            tasks = [
                callback(event_type=event_type, data=data)
                for callback in self.subscribers.get(event_type, [])
            ]
            await asyncio.gather(*tasks)

# Singleton instance
event_dispatcher = EventDispatcher()
