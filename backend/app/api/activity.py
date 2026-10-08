from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import Activity, User
from app.schemas.activity import ActivityResponse


router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("", response_model=list[ActivityResponse])
def get_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activities = db.scalars(
        select(Activity)
        .where(Activity.actor_user_id == current_user.id)
        .order_by(Activity.created_at.desc())
    ).all()

    return activities