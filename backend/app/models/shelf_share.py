from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ShelfShare(Base):
    __tablename__ = "shelf_shares"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    shelf_id: Mapped[int] = mapped_column(
        ForeignKey("shelves.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    shelf = relationship("Shelf", backref="shares")
    user = relationship("User", backref="shelf_shares")

    __table_args__ = (
        UniqueConstraint(
            "shelf_id",
            "user_id",
            name="uq_shelf_share",
        ),
    )