"""
db/database.py — Async MongoDB connection and index management via Motor.
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import get_settings

logger = logging.getLogger(__name__)

# Module-level client — shared across the application lifetime
_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    """Create the Motor client and ensure all required indexes exist."""
    global _client
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    db = _client[settings.database_name]

    # ── products ──────────────────────────────────────────────────────────────
    await db["products"].create_index("user_id")
    await db["products"].create_index(
        [("user_id", 1), ("url", 1)], unique=True, name="user_url_unique"
    )

    # ── price_history ─────────────────────────────────────────────────────────
    await db["price_history"].create_index("product_id")
    await db["price_history"].create_index("timestamp")

    # ── deal_cache — TTL: documents expire 3 600 s after fetched_at ───────────
    await db["deal_cache"].create_index(
        "fetched_at", expireAfterSeconds=3600, name="deal_cache_ttl"
    )

    logger.info("MongoDB connected and indexes ensured.")


async def close_db() -> None:
    """Close the Motor client gracefully on shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database handle. Raises if not yet connected."""
    if _client is None:
        raise RuntimeError("Database not initialised — call connect_db() first.")
    return _client[get_settings().database_name]
