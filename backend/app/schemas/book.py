from datetime import date, datetime

from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    status: str = Field(default="want_to_read")
    total_pages: int = Field(gt=0)
    rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = None
    total_pages: int | None = Field(default=None, gt=0)
    rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None


class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    status: str
    total_pages: int
    rating: int | None
    notes: str | None
    added_at: datetime
    finished_at: date | None

    model_config = {
        "from_attributes": True,
    }