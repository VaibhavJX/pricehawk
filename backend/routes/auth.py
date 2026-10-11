"""
routes/auth.py — JWT-based authentication endpoints.

POST /api/auth/register  — Create a new user account.
POST /api/auth/login     — Authenticate and return a JWT.
GET  /api/auth/me        — Return the current user's public profile.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import get_settings
from db.database import get_database
from models.user import Token, UserCreate, UserLogin, UserPublic

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def _create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": subject, "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


async def get_current_user(token: Annotated[str, Depends(_oauth2_scheme)]) -> dict:
    """FastAPI dependency — resolve JWT to the user document."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exc
    return user


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate) -> Token:
    """Register a new user account and return an access token."""
    db = get_database()

    existing = await db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": payload.email,
        "name": payload.name,
        "hashed_password": _hash_password(payload.password),
        "created_at": now,
        "push_subscriptions": [],
        "notification_prefs": {
            "email_enabled": True,
            "telegram_enabled": False,
            "web_push_enabled": True,
            "telegram_chat_id": None,
        },
    }
    result = await db["users"].insert_one(user_doc)
    access_token = _create_access_token(str(result.inserted_id))
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()) -> Token:
    """
    Authenticate with email + password and return a JWT.

    Accepts standard OAuth2 form data (username field = email).
    """
    db = get_database()
    user = await db["users"].find_one({"email": form.username})
    if not user or not _verify_password(form.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = _create_access_token(str(user["_id"]))
    return Token(access_token=access_token)


@router.post("/login/json", response_model=Token)
async def login_json(payload: UserLogin) -> Token:
    """
    JSON-body login alternative (for clients that can't send form data).
    """
    db = get_database()
    user = await db["users"].find_one({"email": payload.email})
    if not user or not _verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    access_token = _create_access_token(str(user["_id"]))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    """Return the currently authenticated user's public profile."""
    current_user["_id"] = str(current_user["_id"])
    return UserPublic(**current_user)
