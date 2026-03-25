from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Text, Boolean, Integer, DateTime


class Base(DeclarativeBase):
    pass


class Admin(Base):
    __tablename__ = "admins"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    write: Mapped[bool] = mapped_column(Boolean, nullable=False)


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_timestamp: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    message_group: Mapped[str] = mapped_column(Text, nullable=False)
    sender_email: Mapped[str] = mapped_column(Text, nullable=False)
    sender_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    recipient_email: Mapped[str] = mapped_column(Text, nullable=False)
    recipient_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    message_content: Mapped[str] = mapped_column(Text, nullable=False)


class HiddenCardOverride(Base):
    __tablename__ = "hidden_card_overrides"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recipient_email: Mapped[str] = mapped_column(Text, nullable=False)
    message_group: Mapped[str] = mapped_column(Text, nullable=False)


class Attachment(Base):
    __tablename__ = "attachments"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_group: Mapped[str] = mapped_column(Text, nullable=False)
    attachment: Mapped[str] = mapped_column(Text, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False)


class AttachmentPref(Base):
    __tablename__ = "attachment_prefs"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recipient_email: Mapped[str] = mapped_column(Text, nullable=False)
    message_group: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_id: Mapped[int] = mapped_column(Integer, nullable=False)


class GoogleSlidesId(Base):
    __tablename__ = "google_slides_ids"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_group: Mapped[str] = mapped_column(Text, nullable=False)
    presentation_id: Mapped[str] = mapped_column(Text, nullable=False)


class SwapPref(Base):
    __tablename__ = "swap_prefs"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recipient_email: Mapped[str] = mapped_column(Text, nullable=False)
    message_group_from: Mapped[str] = mapped_column(Text, nullable=False)
    message_group_to: Mapped[str] = mapped_column(Text, nullable=False)


class RecentlyDeletedMessage(Base):
    __tablename__ = "recently_deleted_messages"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_timestamp: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    deleted_timestamp: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    message_group: Mapped[str] = mapped_column(Text, nullable=False)
    sender_email: Mapped[str] = mapped_column(Text, nullable=False)
    sender_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    recipient_email: Mapped[str] = mapped_column(Text, nullable=False)
    recipient_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    message_content: Mapped[str] = mapped_column(Text, nullable=False)


class Log(Base):
    __tablename__ = "logs"
    __table_args__ = {"schema": "lifted"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    log_timestamp: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    user_email: Mapped[str] = mapped_column(Text, nullable=False)
    user_name: Mapped[str] = mapped_column(Text, nullable=False)
    log_type: Mapped[str] = mapped_column(Text, nullable=False)
    error_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    log_content: Mapped[str] = mapped_column(Text, nullable=False)


class CpTap(Base):
    __tablename__ = "cp_taps"
    __table_args__ = {"schema": "lifted"}

    netid: Mapped[str] = mapped_column(Text, primary_key=True)
    responded_timestamp: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    tap_name: Mapped[str] = mapped_column(Text, nullable=False)
    accept_tap: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    clear_schedule: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    wear_clothing: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    monitor_inbox: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    pronouns: Mapped[str | None] = mapped_column(Text, nullable=True)
    phonetic_spelling: Mapped[str | None] = mapped_column(Text, nullable=True)
    allergens: Mapped[str | None] = mapped_column(Text, nullable=True)
    physical_accommodations: Mapped[str | None] = mapped_column(Text, nullable=True)
