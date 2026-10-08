from sqlalchemy.orm import Session

from app.models import Activity
from app.services.websocket import manager


def create_activity(
    db: Session,
    actor_user_id: int,
    activity_type: str,
    message: str,
    book_id: int | None = None,
    shelf_id: int | None = None,
    target_user_id: int | None = None,
    extra_data: dict | None = None,
):
    activity = Activity(
        actor_user_id=actor_user_id,
        type=activity_type,
        message=message,
        book_id=book_id,
        shelf_id=shelf_id,
        target_user_id=target_user_id,
        extra_data=extra_data,
    )

    db.add(activity)
    db.flush()

    return activity