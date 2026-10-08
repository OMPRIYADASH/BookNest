from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models import Book, Shelf, ShelfBook, ShelfShare, User
from app.services.activity import create_activity
from app.schemas.book import BookResponse
from app.schemas.shelf import (
    ShelfCreate,
    ShelfResponse,
    ShelfUpdate,
    ShelfShareCreate,
    ShelfShareResponse,
)

router = APIRouter(prefix="/shelves", tags=["Shelves"])


def get_shelf_access(
    shelf_id: int,
    current_user: User,
    db: Session,
):
    """
    Returns the shelf and the current user's role.

    Owner -> owner
    Shared editor -> editor
    Shared viewer -> viewer
    No access -> 403
    """

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
    "",
    response_model=ShelfResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shelf(
    data: ShelfCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_shelf = db.scalar(
        select(Shelf).where(
            Shelf.owner_id == current_user.id,
            Shelf.name == data.name,
        )
    )

    if existing_shelf:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A shelf with this name already exists.",
        )

    shelf = Shelf(
        owner_id=current_user.id,
        name=data.name,
    )

    db.add(shelf)
    db.commit()
    db.refresh(shelf)

    return shelf


@router.get(
    "",
    response_model=list[ShelfResponse],
)
def list_shelves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Shelf)
        .where(Shelf.owner_id == current_user.id)
        .order_by(Shelf.created_at.desc())
    )

    return db.scalars(query).all()


@router.get(
    "/shared-with-me",
    response_model=list[ShelfResponse],
)
def shared_shelves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Shelf)
        .join(ShelfShare, ShelfShare.shelf_id == Shelf.id)
        .where(ShelfShare.user_id == current_user.id)
        .order_by(Shelf.created_at.desc())
    )

    return db.scalars(query).all()


@router.get(
    "/{shelf_id}",
    response_model=ShelfResponse,
)
def get_shelf(
    shelf_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(
        shelf_id=shelf_id,
        current_user=current_user,
        db=db,
    )

    return {
        "id": shelf.id,
        "name": shelf.name,
        "owner_id": shelf.owner_id,
        "created_at": shelf.created_at,
        "role": role,
    }


@router.get(
    "/{shelf_id}/books",
    response_model=list[BookResponse],
)
def get_shelf_books(
    shelf_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, _role = get_shelf_access(
        shelf_id=shelf_id,
        current_user=current_user,
        db=db,
    )

    query = (
        select(Book)
        .join(ShelfBook, ShelfBook.book_id == Book.id)
        .where(
            ShelfBook.shelf_id == shelf.id,
        )
        .order_by(Book.added_at.desc())
    )

    return db.scalars(query).all()


@router.post(
    "/{shelf_id}/books/{book_id}",
    status_code=status.HTTP_201_CREATED,
)
def add_book_to_shelf(
    shelf_id: int,
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(
        shelf_id=shelf_id,
        current_user=current_user,
        db=db,
    )

    if role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot add books to a shelf.",
        )

    book = db.scalar(
        select(Book).where(
            Book.id == book_id,
        )
    )

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found.",
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
            detail="Book is already in this shelf.",
        )

    shelf_book = ShelfBook(
        shelf_id=shelf_id,
        book_id=book_id,
    )

    db.add(shelf_book)

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="book_added_to_shelf",
        message=(
            f"Added book '{book.title}' to shelf "
            f"'{shelf.name}'."
        ),
        shelf_id=shelf.id,
        book_id=book.id,
    )

    db.commit()

    return {
        "message": f"Book '{book.title}' added to shelf '{shelf.name}'."
    }


@router.delete(
    "/{shelf_id}/books/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_book_from_shelf(
    shelf_id: int,
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(
        shelf_id=shelf_id,
        current_user=current_user,
        db=db,
    )

    if role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot remove books from a shelf.",
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
            detail="Book is not in this shelf.",
        )

    book = db.get(Book, book_id)

    db.delete(shelf_book)

    if book:
        create_activity(
            db=db,
            actor_user_id=current_user.id,
            activity_type="book_removed_from_shelf",
            message=(
                f"Removed book '{book.title}' from shelf "
                f"'{shelf.name}'."
            ),
            shelf_id=shelf.id,
            book_id=book.id,
        )

    db.commit()

    return None


@router.put(
    "/{shelf_id}",
    response_model=ShelfResponse,
)
def update_shelf(
    shelf_id: int,
    data: ShelfUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(
        shelf_id=shelf_id,
        current_user=current_user,
        db=db,
    )

    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the shelf owner can rename the shelf.",
        )

    duplicate = db.scalar(
        select(Shelf).where(
            Shelf.owner_id == current_user.id,
            Shelf.name == data.name,
            Shelf.id != shelf_id,
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A shelf with this name already exists.",
        )

    shelf.name = data.name

    db.commit()
    db.refresh(shelf)

    return {
        "id": shelf.id,
        "name": shelf.name,
        "owner_id": shelf.owner_id,
        "created_at": shelf.created_at,
        "role": "owner",
    }


@router.delete(
    "/{shelf_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_shelf(
    shelf_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf, role = get_shelf_access(
        shelf_id=shelf_id,
        current_user=current_user,
        db=db,
    )

    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the shelf owner can delete the shelf.",
        )

    db.delete(shelf)
    db.commit()

    return None


@router.post(
    "/{shelf_id}/shares",
    response_model=ShelfShareResponse,
    status_code=status.HTTP_201_CREATED,
)
def share_shelf(
    shelf_id: int,
    data: ShelfShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf = db.scalar(
        select(Shelf).where(
            Shelf.id == shelf_id,
            Shelf.owner_id == current_user.id,
        )
    )

    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found.",
        )

    if data.role not in {"editor", "viewer"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be editor or viewer.",
        )

    shared_user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if not shared_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if shared_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a shelf with yourself.",
        )

    existing_share = db.scalar(
        select(ShelfShare).where(
            ShelfShare.shelf_id == shelf_id,
            ShelfShare.user_id == shared_user.id,
        )
    )

    if existing_share:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shelf is already shared with this user.",
        )

    share = ShelfShare(
        shelf_id=shelf_id,
        user_id=shared_user.id,
        role=data.role,
    )

    db.add(share)
    db.flush()

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="shelf_shared",
        message=(
            f"Shared shelf '{shelf.name}' with "
            f"{shared_user.email} as {data.role}."
        ),
        shelf_id=shelf.id,
        target_user_id=shared_user.id,
        extra_data={
            "role": data.role,
        },
    )

    db.commit()
    db.refresh(share)

    return share


@router.get(
    "/{shelf_id}/shares",
    response_model=list[ShelfShareResponse],
)
def list_shelf_shares(
    shelf_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf = db.scalar(
        select(Shelf).where(
            Shelf.id == shelf_id,
            Shelf.owner_id == current_user.id,
        )
    )

    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found.",
        )

    query = (
        select(ShelfShare)
        .where(ShelfShare.shelf_id == shelf_id)
        .order_by(ShelfShare.created_at.asc())
    )

    return db.scalars(query).all()


@router.put(
    "/{shelf_id}/shares/{share_id}",
    response_model=ShelfShareResponse,
)
def update_share_role(
    shelf_id: int,
    share_id: int,
    share_data: ShelfShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf = db.get(Shelf, shelf_id)

    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found.",
        )

    if shelf.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the shelf owner can change collaborator roles.",
        )

    if share_data.role not in ("editor", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be editor or viewer.",
        )

    share = db.scalar(
        select(ShelfShare).where(
            ShelfShare.id == share_id,
            ShelfShare.shelf_id == shelf_id,
        )
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator share not found.",
        )

    old_role = share.role
    share.role = share_data.role

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="shelf_role_changed",
        message=(
            f"Changed {share.user.email}'s role on shelf "
            f"'{shelf.name}' from {old_role} to {share_data.role}."
        ),
        shelf_id=shelf.id,
        target_user_id=share.user_id,
        extra_data={
            "old_role": old_role,
            "new_role": share_data.role,
        },
    )

    db.commit()
    db.refresh(share)

    return share


@router.delete(
    "/{shelf_id}/shares/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_share(
    shelf_id: int,
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shelf = db.get(Shelf, shelf_id)

    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found.",
        )

    if shelf.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the shelf owner can remove collaborators.",
        )

    share = db.scalar(
        select(ShelfShare).where(
            ShelfShare.id == share_id,
            ShelfShare.shelf_id == shelf_id,
        )
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator share not found.",
        )

    create_activity(
        db=db,
        actor_user_id=current_user.id,
        activity_type="shelf_collaborator_removed",
        message=(
            f"Removed {share.user.email} from shelf "
            f"'{shelf.name}'."
        ),
        shelf_id=shelf.id,
        target_user_id=share.user_id,
    )

    db.delete(share)
    db.commit()

    return None