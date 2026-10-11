"""
models/user.py — Pydantic models for authentication and user preferences.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ─── Auth models ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Registration payload."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)


class UserLogin(BaseModel):
    """Login payload."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT response returned after successful authentication."""
    access_token: str
    token_type: str = "bearer"


# ─── Notification prefs ───────────────────────────────────────────────────────

class NotificationPrefs(BaseModel):
    """User's preferred notification channels."""
    email_enabled: bool = True
    telegram_enabled: bool = False
    web_push_enabled: bool = True
    telegram_chat_id: Optional[str] = None


class PushSubscription(BaseModel):
    """Web Push subscription object sent from the browser."""
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}
    expiration_time: Optional[int] = None


# ─── User document ────────────────────────────────────────────────────────────

class User(BaseModel):
    """Full user record stored in MongoDB."""
    id: str = Field(alias="_id")
    email: EmailStr
    name: str
    hashed_password: str
    created_at: datetime
    push_subscriptions: list[PushSubscription] = []
    notification_prefs: NotificationPrefs = NotificationPrefs()

    model_config = {"populate_by_name": True}


class UserPublic(BaseModel):
    """Safe user representation returned to the client (no password)."""
    id: str = Field(alias="_id")
    email: EmailStr
    name: str
    created_at: datetime
    notification_prefs: NotificationPrefs = NotificationPrefs()

    model_config = {"populate_by_name": True}
