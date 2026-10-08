from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        self.connections[user_id].discard(websocket)

        if not self.connections[user_id]:
            del self.connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        for websocket in list(self.connections.get(user_id, set())):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(user_id, websocket)


manager = ConnectionManager()

async def notify_user(user_id: int, message: dict):
    await manager.send_to_user(user_id, message)