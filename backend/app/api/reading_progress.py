from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import Book, ReadingProgress, User
from app.schemas.reading_progress import (
    ReadingProgressCreate,
    ReadingProgressResponse,
)

router = APIRouter(prefix="/books", tags=["Reading Progress"])


@router.post(
    "/{book_id}/progress",
    response_model=ReadingProgressResponse,
)
def update_reading_progress(
    book_id: int,
    progress_data: ReadingProgressCreate,
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

    if progress_data.current_page > book.total_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current page cannot be greater than total pages.",
        )

    if book.status != "reading":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reading progress can only be logged for books with Reading status.",
        )

    progress = db.scalar(
        select(ReadingProgress).where(
            ReadingProgress.book_id == book_id
        )
    )

    if not progress:
        progress = ReadingProgress(
            book_id=book_id,
            current_page=progress_data.current_page,
        )
        db.add(progress)
    else:
        progress.current_page = progress_data.current_page

    if progress_data.current_page == book.total_pages:
        book.status = "finished"
        book.finished_at = date.today()

    db.commit()
    db.refresh(progress)

    percentage = round(
        (progress.current_page / book.total_pages) * 100,
        2,
    )

    return ReadingProgressResponse(
        book_id=book.id,
        current_page=progress.current_page,
        total_pages=book.total_pages,
        percentage=percentage,
        status=book.status,
        updated_at=progress.updated_at,
    )


@router.get(
    "/{book_id}/progress",
    response_model=ReadingProgressResponse,
)
def get_reading_progress(
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

    progress = db.scalar(
        select(ReadingProgress).where(
            ReadingProgress.book_id == book_id
        )
    )

    if not progress:
        current_page = 0
        updated_at = book.added_at
    else:
        current_page = progress.current_page
        updated_at = progress.updated_at

    percentage = round(
        (current_page / book.total_pages) * 100,
        2,
    )

    return ReadingProgressResponse(
        book_id=book.id,
        current_page=current_page,
        total_pages=book.total_pages,
        percentage=percentage,
        status=book.status,
        updated_at=updated_at,
    )