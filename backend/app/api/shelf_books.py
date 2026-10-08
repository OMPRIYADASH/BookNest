from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import Book, Shelf, ShelfBook, ShelfShare, User
from app.services.websocket import notify_user

router = APIRouter(prefix="/shelves", tags=["Shelf Books"])


def get_shelf_access(
    shelf_id: int,
    current_user: User,
    db: Session,
):
    shelf = db.get(Shelf, shelf_id)

    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found.",
        )

    if shelf.owner_id == current_user.id:
        return shelf, "owner"

    share = db.scalar(
        select(ShelfShare).where(
            ShelfShare.shelf_id == shelf_id,
            ShelfShare.user_id == current_user.id,
        )
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this shelf.",
        )

    return shelf, share.role


@router.post(
    "/{shelf_id}/books/{book_id}",
    status_code=status.HTTP_201_CREATED,
)
async def add_book_to_shelf(
    shelf_id: int,
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(shelf_id, current_user, db)

    if role not in ("owner", "editor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot modify this shelf.",
        )

    book = db.get(Book, book_id)

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found.",
        )

    if book.owner_id != shelf.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only books owned by the shelf owner can be added.",
        )

    existing = db.scalar(
        select(ShelfBook).where(
            ShelfBook.shelf_id == shelf_id,
            ShelfBook.book_id == book_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book is already on this shelf.",
        )

    shelf_book = ShelfBook(
        shelf_id=shelf_id,
        book_id=book_id,
    )

    db.add(shelf_book)
    db.commit()

    await notify_user(
        shelf.owner_id,
        {
            "type": "shelf_book_added",
            "message": f"Book '{book.title}' was added to shelf '{shelf.name}'.",
            "shelf_id": shelf.id,
            "book_id": book.id,
        },
    )

    shares = db.scalars(
        select(ShelfShare).where(
            ShelfShare.shelf_id == shelf.id,
        )
    ).all()

    for share in shares:
        if share.user_id != current_user.id:
            await notify_user(
                share.user_id,
                {
                    "type": "shelf_book_added",
                    "message": f"Book '{book.title}' was added to shelf '{shelf.name}'.",
                    "shelf_id": shelf.id,
                    "book_id": book.id,
                },
            )

        return {
            "message": "Book added to shelf.",
            "shelf_id": shelf_id,
            "book_id": book_id,
        }


@router.get("/{shelf_id}/books")
def list_shelf_books(
    shelf_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(shelf_id, current_user, db)

    query = (
        select(Book)
        .join(ShelfBook, ShelfBook.book_id == Book.id)
        .where(ShelfBook.shelf_id == shelf.id)
        .order_by(Book.added_at.desc())
    )

    return db.scalars(query).all()


@router.delete(
    "/{shelf_id}/books/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_book_from_shelf(
    shelf_id: int,
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(shelf_id, current_user, db)

    if role not in ("owner", "editor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot modify this shelf.",
        )

    shelf_book = db.scalar(
        select(ShelfBook).where(
            ShelfBook.shelf_id == shelf_id,
            ShelfBook.book_id == book_id,
        )
    )

    if not shelf_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book is not on this shelf.",
        )

    db.delete(shelf_book)
    db.commit()

    await notify_user(
        shelf.owner_id,
        {
            "type": "shelf_book_removed",
            "message": f"Book was removed from shelf '{shelf.name}'.",
            "shelf_id": shelf.id,
            "book_id": book_id,
        },
    )

    shares = db.scalars(
        select(ShelfShare).where(
            ShelfShare.shelf_id == shelf.id,
        )
    ).all()

    for share in shares:
        if share.user_id != current_user.id:
            await notify_user(
                share.user_id,
                {
                    "type": "shelf_book_removed",
                    "message": f"Book was removed from shelf '{shelf.name}'.",
                    "shelf_id": shelf.id,
                    "book_id": book_id,
                },
            )

    return None