from datetime import datetime

from pydantic import BaseModel, Field


class ReadingProgressCreate(BaseModel):
    current_page: int = Field(ge=0)


class ReadingProgressResponse(BaseModel):
    book_id: int
    current_page: int
    total_pages: int
    percentage: float
    status: str
    updated_at: datetime