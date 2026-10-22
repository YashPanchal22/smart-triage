"""Shared WebSocket broadcast hub (imported by main + ecosystem routers)."""
from datetime import datetime, timezone
from typing import List
from fastapi import WebSocket


class Hub:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def drop(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, event: str, payload: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json({"event": event, "data": payload, "at": datetime.now(timezone.utc).isoformat()})
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.drop(ws)


hub = Hub()
