from datetime import datetime

from pydantic import BaseModel, Field


class ShelfCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ShelfUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ShelfResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    role: str | None = None

    model_config = {"from_attributes": True}


class ShelfShareCreate(BaseModel):
    email: str
    role: str


class ShelfShareResponse(BaseModel):
    id: int
    shelf_id: int
    user_id: int
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}