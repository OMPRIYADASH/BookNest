from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import Book, User
from app.services.activity import create_activity
from app.services.websocket import notify_user
from app.schemas.book import BookCreate, BookResponse, BookUpdate

router = APIRouter(prefix="/books", tags=["Books"])


@router.post(
    "",
    response_model=BookResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_book(
    data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_statuses = {"want_to_read", "reading", "finished"}

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid book status.",
        )

    finished_at = date.today() if data.status == "finished" else None

    book = Book(
        owner_id=current_user.id,
        title=data.title,
        author=data.author,
        status=data.status,
        total_pages=data.total_pages,
        rating=data.rating,
        notes=data.notes,
        finished_at=finished_at,
    )

    db.add(book)
    db.flush()

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="book_added",
        message=f"Added book '{book.title}'.",
        book_id=book.id,
    )

    db.commit()
    db.refresh(book)

    await notify_user(
    current_user.id,
    {
        "type": "book_added",
        "message": f"Added book '{book.title}'.",
        "book_id": book.id,
    },
)

    return book


@router.get(
    "",
    response_model=list[BookResponse],
)
def list_books(
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    sort_by: str = Query(
        default="added_at",
        pattern="^(added_at|title|rating)$",
    ),
    sort_order: str = Query(
        default="desc",
        pattern="^(asc|desc)$",
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Book).where(Book.owner_id == current_user.id)

    allowed_statuses = {"want_to_read", "reading", "finished"}

    if status_filter is not None:
        if status_filter not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid book status.",
            )

        query = query.where(Book.status == status_filter)

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            or_(
                Book.title.ilike(search_pattern),
                Book.author.ilike(search_pattern),
            )
        )

    sort_columns = {
        "added_at": Book.added_at,
        "title": Book.title,
        "rating": Book.rating,
    }

    sort_column = sort_columns[sort_by]

    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    offset = (page - 1) * page_size

    query = query.offset(offset).limit(page_size)

    return db.scalars(query).all()


@router.put(
    "/{book_id}",
    response_model=BookResponse,
)
def update_book(
    book_id: int,
    data: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.scalar(
        select(Book).where(
            Book.id == book_id,
            Book.owner_id == current_user.id,
        )
    )

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found.",
        )

    allowed_statuses = {"want_to_read", "reading", "finished"}

    if data.status is not None and data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid book status.",
        )

    old_status = book.status

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(book, field, value)

    if data.status == "finished":
        book.finished_at = date.today()

    elif data.status is not None and data.status != "finished":
        book.finished_at = None

    if data.status is not None and data.status != old_status:
        create_activity(
            db=db,
            actor_user_id=current_user.id,
            activity_type="status_changed",
            message=f"Changed '{book.title}' status from '{old_status}' to '{book.status}'.",
            book_id=book.id,
            extra_data={
                "old_status": old_status,
                "new_status": book.status,
            },
        )

    db.commit()
    db.refresh(book)

    return book


@router.delete(
    "/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.scalar(
        select(Book).where(
            Book.id == book_id,
            Book.owner_id == current_user.id,
        )
    )

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found.",
        )

    db.delete(book)
    db.commit()

    return None