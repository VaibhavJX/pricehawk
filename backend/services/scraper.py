"""
services/scraper.py — Universal product scraper.

Strategy (in order):
  1. Try Playwright (headless Chromium) for JS-rendered pages.
  2. Fall back to httpx + BeautifulSoup for plain HTML pages if Playwright
     is unavailable or raises an error.

Platform-specific extractors are tried first; a generic JSON-LD / meta /
heuristic regex extractor is used as a final fallback.
"""

import asyncio
import json
import logging
import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ─── Platform detection ───────────────────────────────────────────────────────

def detect_platform(url: str) -> str:
    """Return a platform label based on the URL hostname."""
    host = urlparse(url).netloc.lower()
    if "amazon" in host:
        return "amazon"
    if "flipkart" in host:
        return "flipkart"
    if "myntra" in host:
        return "myntra"
    if "snapdeal" in host:
        return "snapdeal"
    if "meesho" in host:
        return "meesho"
    return "generic"


# ─── HTML parsing helpers ─────────────────────────────────────────────────────

def _clean_price(raw: str) -> Optional[float]:
    """Strip currency symbols / commas and convert to float."""
    if not raw:
        return None
    cleaned = re.sub(r"[^\d.]", "", raw.replace(",", ""))
    try:
        return float(cleaned)
    except ValueError:
        return None


def _extract_amazon(soup: BeautifulSoup) -> dict:
    """Extract product data from an Amazon product page."""
    name = None
    price = None
    original_price = None
    image_url = None

    # Name
    for sel in ["#productTitle", "#title"]:
        tag = soup.select_one(sel)
        if tag:
            name = tag.get_text(strip=True)
            break

    # Current price — try several known selectors
    price_selectors = [
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price-whole",
        "#corePrice_feature_div .a-price .a-offscreen",
        "#apex_desktop_qualifiedBuybox .a-price .a-offscreen",
        ".priceToPay .a-offscreen",
        "#price_inside_buybox",
    ]
    for sel in price_selectors:
        tag = soup.select_one(sel)
        if tag:
            price = _clean_price(tag.get_text())
            if price:
                break

    # Original / list price
    orig_selectors = [
        ".basisPrice .a-offscreen",
        "#listPrice",
        ".priceBlockStrikePriceString",
        ".a-text-strike",
    ]
    for sel in orig_selectors:
        tag = soup.select_one(sel)
        if tag:
            original_price = _clean_price(tag.get_text())
            if original_price:
                break

    # Image
    img = soup.select_one("#landingImage, #imgBlkFront, .a-dynamic-image")
    if img:
        image_url = img.get("src") or img.get("data-src")

    return {
        "name": name,
        "price": price,
        "original_price": original_price,
        "image_url": image_url,
        "platform": "amazon",
        "currency": "INR",
    }


def _extract_flipkart(soup: BeautifulSoup) -> dict:
    """Extract product data from a Flipkart product page."""
    name = None
    price = None
    original_price = None
    image_url = None

    # Name
    for sel in [".B_NuCI", "h1._9E25nV", "h1.yhB1nd"]:
        tag = soup.select_one(sel)
        if tag:
            name = tag.get_text(strip=True)
            break

    # Current price
    for sel in ["._30jeq3._16Jk6d", "._30jeq3", ".CEmiEU", "._1vC4OE._3qQ9m1"]:
        tag = soup.select_one(sel)
        if tag:
            price = _clean_price(tag.get_text())
            if price:
                break

    # Original price
    for sel in ["._3I9_wc._2p6lqe", "._3I9_wc", ".CANkS4"]:
        tag = soup.select_one(sel)
        if tag:
            original_price = _clean_price(tag.get_text())
            if original_price:
                break

    # Image
    img = soup.select_one("._396cs4._2amPTt._3qGmMb, img._396cs4")
    if img:
        image_url = img.get("src")

    return {
        "name": name,
        "price": price,
        "original_price": original_price,
        "image_url": image_url,
        "platform": "flipkart",
        "currency": "INR",
    }


def _extract_generic(soup: BeautifulSoup, url: str) -> dict:
    """
    Generic extractor using:
      1. JSON-LD schema.org/Product
      2. Open Graph meta tags
      3. Heuristic price regex on <span>/<div> text
    """
    name = None
    price = None
    original_price = None
    image_url = None
    currency = "INR"

    # 1. JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            # data might be a list or a single object
            if isinstance(data, list):
                items = data
            else:
                items = [data]
            for item in items:
                schema_type = item.get("@type", "")
                if "Product" in schema_type:
                    name = name or item.get("name")
                    image_url = image_url or (
                        item.get("image", [None])[0]
                        if isinstance(item.get("image"), list)
                        else item.get("image")
                    )
                    offers = item.get("offers", {})
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}
                    price = price or _clean_price(str(offers.get("price", "")))
                    currency = offers.get("priceCurrency", currency)
                    break
        except (json.JSONDecodeError, AttributeError, TypeError):
            pass

    # 2. Open Graph / meta
    if not name:
        og_title = soup.find("meta", property="og:title")
        if og_title:
            name = og_title.get("content")
    if not image_url:
        og_image = soup.find("meta", property="og:image")
        if og_image:
            image_url = og_image.get("content")
    if not price:
        for attr in ["product:price:amount", "og:price:amount"]:
            meta = soup.find("meta", property=attr)
            if meta:
                price = _clean_price(meta.get("content", ""))
                if price:
                    break

    # 3. Heuristic: find spans/divs whose text looks like a price
    if not price:
        price_re = re.compile(r"(?:₹|Rs\.?|INR|USD|\$|EUR|€)\s?[\d,]+(?:\.\d{1,2})?")
        for tag in soup.find_all(["span", "div", "p"], limit=200):
            text = tag.get_text(strip=True)
            match = price_re.search(text)
            if match:
                price = _clean_price(match.group())
                break

    # Page title fallback for name
    if not name:
        title_tag = soup.find("title")
        if title_tag:
            name = title_tag.get_text(strip=True)

    return {
        "name": name,
        "price": price,
        "original_price": original_price,
        "image_url": image_url,
        "platform": detect_platform(url),
        "currency": currency,
    }


def _parse(html: str, url: str) -> dict:
    """Parse raw HTML into a product dict using the appropriate extractor."""
    soup = BeautifulSoup(html, "html.parser")
    platform = detect_platform(url)

    if platform == "amazon":
        result = _extract_amazon(soup)
    elif platform == "flipkart":
        result = _extract_flipkart(soup)
    else:
        result = _extract_generic(soup, url)

    # Ensure all keys are always present
    result.setdefault("name", None)
    result.setdefault("price", None)
    result.setdefault("original_price", None)
    result.setdefault("image_url", None)
    result.setdefault("currency", "INR")
    result.setdefault("platform", platform)
    return result


# ─── Playwright-based scraper ─────────────────────────────────────────────────

try:
    from playwright.async_api import async_playwright, Browser, BrowserContext

    _PLAYWRIGHT_AVAILABLE = True
except ImportError:
    _PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed — falling back to httpx for scraping.")


class UniversalScraper:
    """
    Singleton-style scraper that manages a shared Playwright browser instance
    and falls back to httpx when Playwright is unavailable.
    """

    def __init__(self) -> None:
        self._playwright = None
        self._browser: Optional["Browser"] = None
        self._context: Optional["BrowserContext"] = None
        self._lock = asyncio.Lock()

    # ── Lifecycle ──────────────────────────────────────────────────────────────

    async def start(self) -> None:
        """Launch the browser (called once at application startup)."""
        if not _PLAYWRIGHT_AVAILABLE:
            return
        async with self._lock:
            if self._browser is None:
                self._playwright = await async_playwright().start()
                self._browser = await self._playwright.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                    ],
                )
                self._context = await self._browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    viewport={"width": 1280, "height": 800},
                    locale="en-IN",
                )
                logger.info("Playwright Chromium browser started.")

    async def stop(self) -> None:
        """Close the browser (called on application shutdown)."""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        logger.info("Playwright browser stopped.")

    # ── Internal fetchers ──────────────────────────────────────────────────────

    async def _fetch_with_playwright(self, url: str) -> Optional[str]:
        """Open a new page, wait for network idle, return full HTML."""
        if not self._browser or not self._context:
            return None
        page = await self._context.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            # Give JS a moment to populate dynamic content
            await page.wait_for_timeout(2000)
            return await page.content()
        except Exception as exc:
            logger.warning("Playwright fetch failed for %s: %s", url, exc)
            return None
        finally:
            await page.close()

    async def _fetch_with_httpx(self, url: str) -> Optional[str]:
        """Fetch page HTML using httpx with browser-like headers."""
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-IN,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        try:
            async with httpx.AsyncClient(
                headers=headers, follow_redirects=True, timeout=20.0
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.text
        except Exception as exc:
            logger.warning("httpx fetch failed for %s: %s", url, exc)
            return None

    # ── Public API ─────────────────────────────────────────────────────────────

    async def scrape(self, url: str) -> Optional[dict]:
        """
        Scrape a product URL and return a normalised dict:
            {name, price, original_price, image_url, platform, currency}

        Returns None if both fetch strategies fail.
        """
        html: Optional[str] = None

        # Try Playwright first
        if _PLAYWRIGHT_AVAILABLE and self._browser:
            html = await self._fetch_with_playwright(url)

        # Fall back to httpx
        if html is None:
            html = await self._fetch_with_httpx(url)

        if html is None:
            logger.error("All fetch strategies failed for %s", url)
            return None

        try:
            result = _parse(html, url)
        except Exception as exc:
            logger.exception("Parsing failed for %s: %s", url, exc)
            return None

        logger.info(
            "Scraped %s → price=%s platform=%s",
            url,
            result.get("price"),
            result.get("platform"),
        )
        return result


# Module-level singleton used by the rest of the application
scraper = UniversalScraper()
