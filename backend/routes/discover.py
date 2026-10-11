"""
routes/discover.py — Deal discovery endpoints.

GET /api/discover/?category=electronics — Deals for a category.
GET /api/discover/categories             — List of supported categories.
"""

from fastapi import APIRouter, HTTPException, Query, status

from models.product import DealItem
from services.discovery import discover_deals, get_categories

router = APIRouter(prefix="/api/discover", tags=["discover"])


@router.get("/categories", response_model=list[str])
async def list_categories() -> list[str]:
    """Return all available deal categories."""
    return get_categories()


@router.get("/", response_model=list[DealItem])
async def get_deals(
    category: str = Query("electronics", description="Deal category to fetch."),
) -> list[DealItem]:
    """
    Return deals for the given category.
    Results are cached in MongoDB for 1 hour.
    """
    if category not in get_categories():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown category '{category}'. "
                   f"Valid options: {', '.join(get_categories())}",
        )
    return await discover_deals(category)
