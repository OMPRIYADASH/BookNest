import asyncio
import websockets

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTc5MTI4NjA3NX0.uS4hblyVuuy7JtBnuJyqq_Gzczb9cewvAiwbI0dth80"

USER_ID = 1

async def test():
    uri = f"ws://127.0.0.1:8000/ws/{USER_ID}?token={TOKEN}"

    async with websockets.connect(uri) as websocket:
        print("WebSocket connected successfully!")
        print("Waiting for lending event...")

        message = await websocket.recv()

        print("Received event:")
        print(message)


asyncio.run(test())