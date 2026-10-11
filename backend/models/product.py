"""
models/product.py — Pydantic models for product tracking, price history, and deals.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field


# ─── Request / Input models ───────────────────────────────────────────────────

class ProductCreate(BaseModel):
    """Payload when a user submits a URL to track."""
    url: str = Field(..., description="Product page URL to monitor.")
    target_price: Optional[float] = Field(
        None, description="Alert when price drops to or below this value."
    )
    check_interval_minutes: int = Field(
        60, ge=5, description="How often to poll the price (minimum 5 minutes)."
    )
    notifications_enabled: bool = True


class ProductUpdate(BaseModel):
    """Allowed fields when updating an existing tracked product."""
    target_price: Optional[float] = None
    check_interval_minutes: Optional[int] = Field(None, ge=5)
    notifications_enabled: Optional[bool] = None


# ─── Response models ──────────────────────────────────────────────────────────

class PriceHistoryPoint(BaseModel):
    """A single price data-point in history."""
    price: float
    timestamp: datetime


class ProductResponse(BaseModel):
    """Full product record returned to the client."""
    id: str = Field(alias="_id")
    user_id: str
    url: str
    name: Optional[str] = None
    image_url: Optional[str] = None
    platform: Optional[str] = None
    current_price: Optional[float] = None
    original_price: Optional[float] = None
    currency: str = "INR"
    target_price: Optional[float] = None
    check_interval_minutes: int = 60
    notifications_enabled: bool = True
    last_checked: Optional[datetime] = None
    created_at: datetime
    price_drop_pct: Optional[float] = Field(
        None,
        description="Percentage drop from original price to current price. "
                    "Positive = price dropped.",
    )
    price_history: list[PriceHistoryPoint] = []

    model_config = {"populate_by_name": True}


# ─── Deal discovery models ────────────────────────────────────────────────────

class DealItem(BaseModel):
    """A single deal returned by the discovery/scraping service."""
    name: str
    url: str
    image_url: Optional[str] = None
    current_price: Optional[float] = None
    original_price: Optional[float] = None
    discount_pct: Optional[float] = None
    platform: str = "amazon"
    currency: str = "INR"
