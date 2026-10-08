from datetime import datetime

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: int
    actor_user_id: int
    type: str
    book_id: int | None
    shelf_id: int | None
    target_user_id: int | None
    message: str
    extra_data: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}