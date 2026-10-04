from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    actor_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    book_id: Mapped[int | None] = mapped_column(
        ForeignKey("books.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    shelf_id: Mapped[int | None] = mapped_column(
        ForeignKey("shelves.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    target_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    extra_data: Mapped[dict | None] = mapped_column(
        "metadata",
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    actor = relationship(
        "User",
        foreign_keys=[actor_user_id],
        backref="activities",
    )

    target_user = relationship(
        "User",
        foreign_keys=[target_user_id],
    )

    book = relationship("Book")
    shelf = relationship("Shelf")