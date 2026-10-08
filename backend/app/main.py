from fastapi import Depends, FastAPI, WebSocket
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.books import router as books_router
from app.db.session import engine
from app.api.shelves import router as shelves_router
from app.api.shelf_books import router as shelf_books_router
from app.api.reading_progress import router as reading_progress_router
from app.api.dependencies import get_current_user
from app.models import User
from app.api.lending import router as lending_router
from app.api.activity import router as activity_router
from app.api.dashboard import router as dashboard_router
from app.services.websocket import manager
from app.api.dependencies import get_current_user, get_user_from_token
from app.db.session import SessionLocal, engine


app = FastAPI(title="BookNest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(books_router)
app.include_router(shelves_router)
app.include_router(shelf_books_router)
app.include_router(reading_progress_router)
app.include_router(lending_router)
app.include_router(activity_router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BookNest API"}

@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }


@app.get("/health/db")
def database_health_check():
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")

    return {"status": "ok", "database": "connected"}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    with SessionLocal() as db:
        current_user = get_user_from_token(token, db)

        if not current_user or current_user.id != user_id:
            await websocket.close(code=1008)
            return

    await manager.connect(user_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except Exception:
        manager.disconnect(user_id, websocket)