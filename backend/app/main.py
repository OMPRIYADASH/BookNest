from fastapi import Depends, FastAPI

from app.api.auth import router as auth_router
from app.db.session import engine

from app.api.dependencies import get_current_user
from app.models import User


app = FastAPI(title="BookNest API")


app.include_router(auth_router)


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