from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import Book, Lending, User
from app.services.activity import create_activity
from app.services.websocket import notify_user
from app.schemas.lending import LendingCreate, LendingResponse

router = APIRouter(prefix="/books", tags=["Lending"])


@router.post(
    "/{book_id}/lend",
    response_model=LendingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def lend_book(
    book_id: int,
    lending_data: LendingCreate,
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

    borrower = db.scalar(
        select(User).where(User.email == lending_data.email)
    )

    if not borrower:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrower not found.",
        )

    if borrower.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot lend a book to yourself.",
        )

    active_lending = db.scalar(
        select(Lending).where(
            Lending.book_id == book_id,
            Lending.active.is_(True),
        )
    )

    if active_lending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book is already lent out.",
        )

    lending = Lending(
        book_id=book_id,
        owner_id=current_user.id,
        borrower_id=borrower.id,
        active=True,
    )

    db.add(lending)
    db.flush()

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="book_lent",
        message=f"Lent '{book.title}' to {borrower.email}.",
        book_id=book.id,
        target_user_id=borrower.id,
    )

    db.commit()
    db.refresh(lending)

    await notify_user(
        current_user.id,
        {
            "type": "book_lent",
            "message": f"Lent '{book.title}' to {borrower.email}.",
            "book_id": book.id,
            "borrower_id": borrower.id,
        },
    )

    await notify_user(
        borrower.id,
        {
            "type": "book_lent",
            "message": f"You borrowed '{book.title}' from {current_user.email}.",
            "book_id": book.id,
            "owner_id": current_user.id,
        },
    )

    return lending


@router.post(
    "/{book_id}/return",
    response_model=LendingResponse,
)
async def return_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lending = db.scalar(
        select(Lending).where(
            Lending.book_id == book_id,
            Lending.owner_id == current_user.id,
            Lending.active.is_(True),
        )
    )

    if not lending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active lending record not found.",
        )

    lending.active = False
    lending.returned_at = datetime.now(timezone.utc)

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="book_returned",
        message=f"Returned '{lending.book.title}' from {lending.borrower.email}.",
        book_id=lending.book_id,
        target_user_id=lending.borrower_id,
    )

    db.commit()
    db.refresh(lending)

    await notify_user(
        current_user.id,
        {
            "type": "book_returned",
            "message": f"Returned '{lending.book.title}' from {lending.borrower.email}.",
            "book_id": lending.book_id,
            "borrower_id": lending.borrower_id,
        },
    )

    await notify_user(
    lending.borrower_id,
    {
        "type": "book_returned",
        "message": f"'{lending.book.title}' has been returned to the owner.",
        "book_id": lending.book_id,
        "owner_id": current_user.id,
    },
    )

    return lending


@router.get(
    "/borrowed",
    response_model=list[LendingResponse],
)
def get_borrowed_books(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Lending)
        .where(
            Lending.borrower_id == current_user.id,
            Lending.active.is_(True),
        )
        .order_by(Lending.lent_at.desc())
    )

    return db.scalars(query).all()