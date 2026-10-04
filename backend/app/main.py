from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.db.session import engine


app = FastAPI(title="BookNest API")


app.include_router(auth_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BookNest API"}


@app.get("/health/db")
def database_health_check():
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")

    return {"status": "ok", "database": "connected"}