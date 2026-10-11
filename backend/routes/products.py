"""
routes/products.py — Product tracking CRUD + manual check.

POST   /api/products/         — Add product to track.
GET    /api/products/         — List all user's tracked products.
GET    /api/products/{id}     — Single product + price history.
PATCH  /api/products/{id}     — Update target price / interval.
DELETE /api/products/{id}     — Stop tracking.
POST   /api/products/{id}/check — Trigger immediate price check.
"""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from db.database import get_database
from models.product import (
    PriceHistoryPoint,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from routes.auth import get_current_user
from services.scheduler import check_product, schedule_product, unschedule_product
from services.scraper import scraper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/products", tags=["products"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product id.")


def _calc_drop_pct(original: float | None, current: float | None) -> float | None:
    if original and current and original > current:
        return round((original - current) / original * 100, 2)
    return None


async def _build_response(product: dict, db) -> ProductResponse:
    """Attach price_history and convert _id to str."""
    pid = str(product["_id"])
    history_cursor = db["price_history"].find(
        {"product_id": pid}, sort=[("timestamp", 1)]
    )
    history = [
        PriceHistoryPoint(price=h["price"], timestamp=h["timestamp"])
        async for h in history_cursor
    ]
    product["_id"] = pid
    product["price_history"] = [h.model_dump() for h in history]
    product["price_drop_pct"] = _calc_drop_pct(
        product.get("original_price"), product.get("current_price")
    )
    return ProductResponse(**product)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product(
    payload: ProductCreate,
    current_user: dict = Depends(get_current_user),
) -> ProductResponse:
    """Add a new product URL to track. Performs an immediate scrape."""
    db = get_database()
    user_id = str(current_user["_id"])

    # Deduplicate per user
    existing = await db["products"].find_one({"user_id": user_id, "url": payload.url})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already tracking this URL.",
        )

    # Immediate scrape to populate name/price/image
    scrape_data = await scraper.scrape(payload.url)

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "url": payload.url,
        "target_price": payload.target_price,
        "check_interval_minutes": payload.check_interval_minutes,
        "notifications_enabled": payload.notifications_enabled,
        "created_at": now,
        "last_checked": now if scrape_data else None,
        "name": scrape_data.get("name") if scrape_data else None,
        "image_url": scrape_data.get("image_url") if scrape_data else None,
        "platform": scrape_data.get("platform") if scrape_data else None,
        "current_price": scrape_data.get("price") if scrape_data else None,
        "original_price": scrape_data.get("original_price") if scrape_data else None,
        "currency": scrape_data.get("currency", "INR") if scrape_data else "INR",
    }
    result = await db["products"].insert_one(doc)
    product_id = str(result.inserted_id)

    # Save initial price-history point
    if scrape_data and scrape_data.get("price"):
        await db["price_history"].insert_one(
            {"product_id": product_id, "price": scrape_data["price"], "timestamp": now}
        )

    # Schedule recurring checks
    schedule_product(product_id, payload.check_interval_minutes)

    doc["_id"] = result.inserted_id
    return await _build_response(doc, db)


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    current_user: dict = Depends(get_current_user),
) -> list[ProductResponse]:
    """Return all tracked products for the authenticated user."""
    db = get_database()
    user_id = str(current_user["_id"])
    products = []
    async for product in db["products"].find({"user_id": user_id}):
        products.append(await _build_response(product, db))
    return products


@router.get("/{id}", response_model=ProductResponse)
async def get_product(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> ProductResponse:
    """Return a single tracked product with full price history."""
    db = get_database()
    product = await db["products"].find_one(
        {"_id": _oid(id), "user_id": str(current_user["_id"])}
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return await _build_response(product, db)


@router.patch("/{id}", response_model=ProductResponse)
async def update_product(
    id: str,
    payload: ProductUpdate,
    current_user: dict = Depends(get_current_user),
) -> ProductResponse:
    """Update target price, check interval, or notification toggle."""
    db = get_database()
    oid = _oid(id)
    product = await db["products"].find_one(
        {"_id": oid, "user_id": str(current_user["_id"])}
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update."
        )

    await db["products"].update_one({"_id": oid}, {"$set": update_fields})

    # Reschedule if interval changed
    if "check_interval_minutes" in update_fields:
        schedule_product(id, update_fields["check_interval_minutes"])

    updated = await db["products"].find_one({"_id": oid})
    return await _build_response(updated, db)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> None:
    """Stop tracking a product and remove its data."""
    db = get_database()
    oid = _oid(id)
    result = await db["products"].delete_one(
        {"_id": oid, "user_id": str(current_user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    unschedule_product(id)
    await db["price_history"].delete_many({"product_id": id})


@router.post("/{id}/check", response_model=ProductResponse)
async def manual_check(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> ProductResponse:
    """Immediately trigger a price check for the given product."""
    db = get_database()
    product = await db["products"].find_one(
        {"_id": _oid(id), "user_id": str(current_user["_id"])}
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    await check_product(id)

    updated = await db["products"].find_one({"_id": _oid(id)})
    return await _build_response(updated, db)
