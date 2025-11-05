from datetime import datetime
from sqlalchemy import (
    String, Integer, BigInteger, DateTime, ForeignKey, Text, func, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

# Các lựa chọn text để dễ đổi trên app (không dùng ENUM cứng)
GOAL_STATUS = ("new", "active", "struggling", "done")
GOAL_CATEGORY = ("quit", "health", "study", "support")

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ext_uid: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # id ngoài (device/email/anon)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    messages: Mapped[list["Message"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    checkins: Mapped[list["Checkin"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Goal(Base):
    __tablename__ = "goals"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(16), default="study")  # in GOAL_CATEGORY
    status: Mapped[str] = mapped_column(String(16), default="new")      # in GOAL_STATUS
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    meta_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # lưu plan JSON, times, v.v.
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="goals")
    messages: Mapped[list["Message"]] = relationship(back_populates="goal", cascade="all, delete-orphan")
    checkins: Mapped[list["Checkin"]] = relationship(back_populates="goal", cascade="all, delete-orphan")

Index("ix_goals_user_status", Goal.user_id, Goal.status)

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    goal_id: Mapped[int | None] = mapped_column(ForeignKey("goals.id", ondelete="SET NULL"), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(8))  # 'user' | 'assistant' | 'system'
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    user: Mapped["User"] = relationship(back_populates="messages")
    goal: Mapped["Goal"] = relationship(back_populates="messages")

class Checkin(Base):
    __tablename__ = "checkins"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    note: Mapped[str] = mapped_column(String(280))      # ghi chú ngắn
    score: Mapped[int] = mapped_column(Integer, default=0)  # 0..10
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    user: Mapped["User"] = relationship(back_populates="checkins")
    goal: Mapped["Goal"] = relationship(back_populates="checkins")
