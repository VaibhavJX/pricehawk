"""
services/discovery.py — Deal discovery service.

Scrapes Amazon India category deal pages and caches results in MongoDB
with a 1-hour TTL (enforced by a MongoDB TTL index on deal_cache.fetched_at).
"""

import logging
import re
from datetime import datetime, timezone
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from models.product import DealItem

logger = logging.getLogger(__name__)

# ─── Category configuration ───────────────────────────────────────────────────

CATEGORIES: dict[str, str] = {
    "electronics": "https://www.amazon.in/gp/bestsellers/electronics",
    "fashion": "https://www.amazon.in/gp/bestsellers/apparel",
    "home": "https://www.amazon.in/gp/bestsellers/kitchen",
    "books": "https://www.amazon.in/gp/bestsellers/books",
    "sports": "https://www.amazon.in/gp/bestsellers/sports",
    "beauty": "https://www.amazon.in/gp/bestsellers/beauty",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

_PRICE_RE = re.compile(r"[\d,]+(?:\.\d{1,2})?")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _clean_price(text: str) -> Optional[float]:
    """Strip non-numeric chars and return float."""
    cleaned = text.replace(",", "").strip()
    m = _PRICE_RE.search(cleaned)
    if m:
        try:
            return float(m.group())
        except ValueError:
            pass
    return None


def _parse_amazon_deals(html: str, category: str) -> list[DealItem]:
    """
    Parse Amazon bestseller HTML and return up to 20 DealItem objects.
    Amazon renders two possible layouts — we handle both with broad selectors.
    """
    soup = BeautifulSoup(html, "html.parser")
    deals: list[DealItem] = []

    # Layout 1: zg-item-immersion grid (most common)
    items = soup.select("li.zg-item-immersion, .p13n-sc-uncoverable-faceout")

    # Layout 2: newer grid with data-asin attributes
    if not items:
        items = soup.select("[data-asin]")

    for item in items[:20]:
        try:
            # Name
            name_tag = item.select_one(
                ".p13n-sc-truncate, .p13n-sc-truncate-desktop-type2, "
                "._cDEzb_p13n-sc-css-line-clamp-1_1Fn1y, a.a-link-normal span"
            )
            name = name_tag.get_text(strip=True) if name_tag else None
            if not name:
                continue

            # URL
            link_tag = item.select_one("a.a-link-normal[href]")
            href = link_tag["href"] if link_tag else None
            if not href:
                continue
            url = f"https://www.amazon.in{href}" if href.startswith("/") else href

            # Image
            img_tag = item.select_one("img")
            image_url = img_tag.get("src") if img_tag else None

            # Current price
            price_tag = item.select_one(
                ".p13n-sc-price, ._cDEzb_p13n-sc-price_3mJ9Z, "
                ".a-color-price, .a-price .a-offscreen"
            )
            current_price = _clean_price(price_tag.get_text()) if price_tag else None

            # Original / list price (sometimes shown struck-through)
            orig_tag = item.select_one(".a-text-strike, .p13n-sc-list-price")
            original_price = _clean_price(orig_tag.get_text()) if orig_tag else None

            # Discount
            discount_pct: Optional[float] = None
            if current_price and original_price and original_price > current_price:
                discount_pct = (original_price - current_price) / original_price * 100

            deals.append(
                DealItem(
                    name=name,
                    url=url,
                    image_url=image_url,
                    current_price=current_price,
                    original_price=original_price,
                    discount_pct=round(discount_pct, 1) if discount_pct else None,
                    platform="amazon",
                    currency="INR",
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.debug("Skipping deal item due to parse error: %s", exc)

    return deals


# ─── Public API ───────────────────────────────────────────────────────────────

async def discover_deals(category: str) -> list[DealItem]:
    """
    Return deals for the given category.

    Flow:
      1. Check MongoDB deal_cache for a fresh entry (MongoDB TTL handles expiry).
      2. If cache miss, scrape Amazon and write to cache.

    Args:
        category: One of the keys in ``CATEGORIES``.

    Returns:
        List of DealItem objects (may be empty on scrape failure).
    """
    from db.database import get_database

    category = category.lower()
    if category not in CATEGORIES:
        logger.warning("Unknown category '%s'; returning empty list.", category)
        return []

    db = get_database()

    # ── Cache lookup ──────────────────────────────────────────────────────────
    cached = await db["deal_cache"].find_one({"category": category})
    if cached:
        logger.info("deal_cache hit for category='%s'", category)
        return [DealItem(**item) for item in cached.get("deals", [])]

    # ── Scrape ────────────────────────────────────────────────────────────────
    url = CATEGORIES[category]
    logger.info("Scraping deals for category='%s' from %s", category, url)

    deals: list[DealItem] = []
    try:
        async with httpx.AsyncClient(
            headers=HEADERS, follow_redirects=True, timeout=25.0
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            deals = _parse_amazon_deals(resp.text, category)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Deal scrape failed for category='%s': %s", category, exc)
        return []

    # ── Cache write ───────────────────────────────────────────────────────────
    if deals:
        await db["deal_cache"].replace_one(
            {"category": category},
            {
                "category": category,
                "deals": [d.model_dump() for d in deals],
                "fetched_at": datetime.now(timezone.utc),
            },
            upsert=True,
        )
        logger.info(
            "Cached %d deals for category='%s'.", len(deals), category
        )

    return deals


def get_categories() -> list[str]:
    """Return the list of supported deal categories."""
    return list(CATEGORIES.keys())
