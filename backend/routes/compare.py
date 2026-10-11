"""
routes/compare.py — Side-by-side product price comparison.

POST /api/compare/         — Scrape two URLs and compare prices.
GET  /api/compare/history  — Price history for two tracked products.
"""

import logging
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from db.database import get_database
from models.product import PriceHistoryPoint, ProductResponse
from routes.auth import get_current_user
from services.scraper import scraper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/compare", tags=["compare"])


# ─── Models ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    url_a: str
    url_b: str


class ScrapeSnapshot(BaseModel):
    url: str
    name: Optional[str] = None
    current_price: Optional[float] = None
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    platform: Optional[str] = None
    currency: str = "INR"
    discount_pct: Optional[float] = None


class CompareResponse(BaseModel):
    product_a: ScrapeSnapshot
    product_b: ScrapeSnapshot
    cheaper: Optional[str] = None  # "a" | "b" | "tie"


class HistoryCompareResponse(BaseModel):
    product_a_id: str
    product_b_id: str
    product_a_history: list[PriceHistoryPoint]
    product_b_history: list[PriceHistoryPoint]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _discount(original: Optional[float], current: Optional[float]) -> Optional[float]:
    if original and current and original > current:
        return round((original - current) / original * 100, 2)
    return None


def _snap(url: str, data: Optional[dict]) -> ScrapeSnapshot:
    if not data:
        return ScrapeSnapshot(url=url)
    return ScrapeSnapshot(
        url=url,
        name=data.get("name"),
        current_price=data.get("price"),
        original_price=data.get("original_price"),
        image_url=data.get("image_url"),
        platform=data.get("platform"),
        currency=data.get("currency", "INR"),
        discount_pct=_discount(data.get("original_price"), data.get("price")),
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=CompareResponse)
async def compare_products(payload: CompareRequest) -> CompareResponse:
    """
    Scrape two product URLs in parallel and return a side-by-side comparison.
    Does NOT require authentication — useful for quick ad-hoc comparisons.
    """
    import asyncio

    data_a, data_b = await asyncio.gather(
        scraper.scrape(payload.url_a),
        scraper.scrape(payload.url_b),
        return_exceptions=True,
    )

    # gather() with return_exceptions=True returns exceptions instead of raising
    if isinstance(data_a, Exception):
        logger.warning("Scrape failed for url_a: %s", data_a)
        data_a = None
    if isinstance(data_b, Exception):
        logger.warning("Scrape failed for url_b: %s", data_b)
        data_b = None

    snap_a = _snap(payload.url_a, data_a)
    snap_b = _snap(payload.url_b, data_b)

    cheaper: Optional[str] = None
    if snap_a.current_price is not None and snap_b.current_price is not None:
        if snap_a.current_price < snap_b.current_price:
            cheaper = "a"
        elif snap_b.current_price < snap_a.current_price:
            cheaper = "b"
        else:
            cheaper = "tie"

    return CompareResponse(product_a=snap_a, product_b=snap_b, cheaper=cheaper)


@router.get("/history", response_model=HistoryCompareResponse)
async def compare_history(
    product_a_id: str = Query(..., description="First tracked product ID."),
    product_b_id: str = Query(..., description="Second tracked product ID."),
    current_user: dict = Depends(get_current_user),
) -> HistoryCompareResponse:
    """Return price history for two of the user's tracked products."""
    db = get_database()
    user_id = str(current_user["_id"])

    async def _get_history(pid: str) -> list[PriceHistoryPoint]:
        try:
            oid = ObjectId(pid)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid product id: {pid}",
            )
        product = await db["products"].find_one({"_id": oid, "user_id": user_id})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {pid} not found.",
            )
        return [
            PriceHistoryPoint(price=h["price"], timestamp=h["timestamp"])
            async for h in db["price_history"].find(
                {"product_id": pid}, sort=[("timestamp", 1)]
            )
        ]

    import asyncio

    history_a, history_b = await asyncio.gather(
        _get_history(product_a_id), _get_history(product_b_id)
    )

    return HistoryCompareResponse(
        product_a_id=product_a_id,
        product_b_id=product_b_id,
        product_a_history=history_a,
        product_b_history=history_b,
    )
