from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import (
    Activity,
    Book,
    Lending,
    Shelf,
    ShelfBook,
    ShelfShare,
    User,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_books = db.scalar(
        select(func.count(Book.id)).where(
            Book.owner_id == current_user.id
        )
    ) or 0

    want_to_read = db.scalar(
        select(func.count(Book.id)).where(
            Book.owner_id == current_user.id,
            Book.status == "want_to_read",
        )
    ) or 0

    reading = db.scalar(
        select(func.count(Book.id)).where(
            Book.owner_id == current_user.id,
            Book.status == "reading",
        )
    ) or 0

    finished = db.scalar(
        select(func.count(Book.id)).where(
            Book.owner_id == current_user.id,
            Book.status == "finished",
        )
    ) or 0

    finished_this_year = db.scalar(
        select(func.count(Book.id)).where(
            Book.owner_id == current_user.id,
            Book.status == "finished",
            Book.finished_at.is_not(None),
            func.extract("year", Book.finished_at) == date.today().year,
        )
    ) or 0

    average_rating = db.scalar(
        select(func.avg(Book.rating)).where(
            Book.owner_id == current_user.id,
            Book.rating.is_not(None),
        )
    )

    shelf_with_most_books = db.execute(
        select(
            Shelf.id,
            Shelf.name,
            func.count(Book.id).label("book_count"),
        )
        .join(
            ShelfBook,
            ShelfBook.shelf_id == Shelf.id,
            isouter=True,
        )
        .join(
            Book,
            Book.id == ShelfBook.book_id,
            isouter=True,
        )
        .where(Shelf.owner_id == current_user.id)
        .group_by(Shelf.id, Shelf.name)
        .order_by(func.count(Book.id).desc())
        .limit(1)
    ).first()

    currently_lent_out = db.scalar(
        select(func.count(Lending.id)).where(
            Lending.owner_id == current_user.id,
            Lending.active.is_(True),
        )
    ) or 0

    shared_shelves = db.scalar(
        select(func.count(ShelfShare.id)).where(
            ShelfShare.user_id == current_user.id
        )
    ) or 0

    recent_activity = db.scalars(
        select(Activity)
        .where(Activity.actor_user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .limit(10)
    ).all()

    return {
        "total_books": total_books,
        "books_by_status": {
            "want_to_read": want_to_read,
            "reading": reading,
            "finished": finished,
        },
        "finished_this_year": finished_this_year,
        "average_rating": round(float(average_rating), 2)
        if average_rating is not None
        else None,
        "shelf_with_most_books": (
            {
                "id": shelf_with_most_books.id,
                "name": shelf_with_most_books.name,
                "book_count": shelf_with_most_books.book_count,
            }
            if shelf_with_most_books
            else None
        ),
        "currently_lent_out": currently_lent_out,
        "shared_shelves": shared_shelves,
        "recent_activity": recent_activity,
    }