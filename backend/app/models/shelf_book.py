from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ShelfBook(Base):
    __tablename__ = "shelf_books"

    shelf_id: Mapped[int] = mapped_column(
        ForeignKey("shelves.id", ondelete="CASCADE"),
        primary_key=True,
    )

    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"),
        primary_key=True,
    )