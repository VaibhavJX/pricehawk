"""
routes/notifications.py — Web Push subscription management and VAPID key delivery.

POST   /api/notifications/subscribe   — Save a browser push subscription.
DELETE /api/notifications/unsubscribe — Remove a browser push subscription.
GET    /api/notifications/vapid-key   — Return VAPID public key to the frontend.
POST   /api/notifications/test        — Send a test notification to verify setup.
"""

import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from config import get_settings
from db.database import get_database
from models.user import PushSubscription
from routes.auth import get_current_user
from services.notifier import send_web_push

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["notifications"])
settings = get_settings()


# ─── Models ───────────────────────────────────────────────────────────────────

class VapidKeyResponse(BaseModel):
    public_key: str


class UnsubscribeRequest(BaseModel):
    endpoint: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/vapid-key", response_model=VapidKeyResponse)
async def get_vapid_key() -> VapidKeyResponse:
    """Return the VAPID public key so the frontend can register push subscriptions."""
    if not settings.vapid_public_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="VAPID keys are not configured on this server.",
        )
    return VapidKeyResponse(public_key=settings.vapid_public_key)


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe(
    payload: PushSubscription,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Save a Web Push subscription to the user's profile.
    Idempotent — if the same endpoint is already stored, it is replaced.
    """
    db = get_database()
    user_id = ObjectId(current_user["_id"])
    endpoint = payload.endpoint

    # Remove any existing subscription with the same endpoint first
    await db["users"].update_one(
        {"_id": user_id},
        {"$pull": {"push_subscriptions": {"endpoint": endpoint}}},
    )
    # Then add the new/updated subscription
    await db["users"].update_one(
        {"_id": user_id},
        {"$push": {"push_subscriptions": payload.model_dump()}},
    )
    logger.info("Push subscription saved for user %s", user_id)
    return {"detail": "Subscription saved."}


@router.delete("/unsubscribe", status_code=status.HTTP_200_OK)
async def unsubscribe(
    payload: UnsubscribeRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Remove a Web Push subscription by its endpoint URL."""
    db = get_database()
    user_id = ObjectId(current_user["_id"])
    await db["users"].update_one(
        {"_id": user_id},
        {"$pull": {"push_subscriptions": {"endpoint": payload.endpoint}}},
    )
    logger.info("Push subscription removed for user %s", user_id)
    return {"detail": "Subscription removed."}


@router.post("/test", status_code=status.HTTP_200_OK)
async def test_notification(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Send a test push notification to all of the user's registered subscriptions.
    Useful for verifying that browser push is configured correctly.
    """
    subscriptions: list[dict] = current_user.get("push_subscriptions", [])
    if not subscriptions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No push subscriptions registered for this account.",
        )

    payload = {
        "title": "🦅 PriceHawk Test",
        "body": "Push notifications are working correctly!",
        "icon": "/icon.png",
    }

    sent = 0
    for sub in subscriptions:
        ok = await send_web_push(sub, payload)
        if ok:
            sent += 1

    return {"detail": f"Test notification sent to {sent}/{len(subscriptions)} subscriptions."}
