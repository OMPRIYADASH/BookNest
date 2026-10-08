from datetime import datetime

from pydantic import BaseModel, EmailStr


class LendingCreate(BaseModel):
    email: EmailStr


class LendingResponse(BaseModel):
    id: int
    book_id: int
    owner_id: int
    borrower_id: int
    lent_at: datetime
    returned_at: datetime | None
    active: bool

    model_config = {"from_attributes": True}