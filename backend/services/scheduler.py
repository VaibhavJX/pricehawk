"""
services/scheduler.py — APScheduler-based product price-check scheduler.

A single AsyncIOScheduler instance is shared across the app.
Jobs are named by product_id for easy add/replace/remove operations.
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore

logger = logging.getLogger(__name__)

# ─── Singleton scheduler ──────────────────────────────────────────────────────

_scheduler = AsyncIOScheduler(
    jobstores={"default": MemoryJobStore()},
    job_defaults={"coalesce": True, "max_instances": 1, "misfire_grace_time": 60},
)


def get_scheduler() -> AsyncIOScheduler:
    return _scheduler


# ─── Price-check job ──────────────────────────────────────────────────────────

async def check_product(product_id: str) -> None:
    """
    Core price-check job executed by the scheduler.

    Steps:
      1. Load product from DB.
      2. Scrape current price.
      3. Save price-history point.
      4. Update product's current_price and last_checked.
      5. If price dropped below target, notify the user.
    """
    from db.database import get_database
    from services.scraper import scraper
    from services.notifier import send_price_drop_notification
    from bson import ObjectId

    try:
        db = get_database()
        oid = ObjectId(product_id)
        product = await db["products"].find_one({"_id": oid})
        if not product:
            logger.warning("check_product: product %s not found — removing job.", product_id)
            unschedule_product(product_id)
            return

        url = product["url"]
        data = await scraper.scrape(url)
        if data is None or data.get("price") is None:
            logger.warning("check_product: scrape returned no price for %s", url)
            return

        new_price: float = data["price"]
        old_price: float | None = product.get("current_price")
        now = datetime.now(timezone.utc)

        # Persist price-history point
        await db["price_history"].insert_one(
            {"product_id": product_id, "price": new_price, "timestamp": now}
        )

        # Update product document
        update_fields: dict = {
            "current_price": new_price,
            "last_checked": now,
        }
        if data.get("name") and not product.get("name"):
            update_fields["name"] = data["name"]
        if data.get("image_url") and not product.get("image_url"):
            update_fields["image_url"] = data["image_url"]
        if data.get("original_price") and not product.get("original_price"):
            update_fields["original_price"] = data["original_price"]

        await db["products"].update_one({"_id": oid}, {"$set": update_fields})

        # Check if we should notify
        notifications_enabled = product.get("notifications_enabled", True)
        target_price: float | None = product.get("target_price")

        should_notify = notifications_enabled and (
            # Price dropped below target
            (target_price is not None and new_price <= target_price)
            # Or any price drop (only if target not set)
            or (
                target_price is None
                and old_price is not None
                and new_price < old_price
            )
        )

        if should_notify:
            user_id = product.get("user_id")
            user = await db["users"].find_one({"_id": ObjectId(user_id)})
            if user:
                await send_price_drop_notification(product, new_price, user)

        logger.info(
            "check_product done: %s price=%s (was %s)", product_id, new_price, old_price
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("check_product error for %s: %s", product_id, exc)


# ─── Scheduling helpers ───────────────────────────────────────────────────────

def schedule_product(product_id: str, interval_minutes: int) -> None:
    """Add or replace a recurring price-check job for a product."""
    job_id = f"product_{product_id}"
    _scheduler.add_job(
        check_product,
        trigger="interval",
        minutes=interval_minutes,
        id=job_id,
        args=[product_id],
        replace_existing=True,
        name=f"Price check for {product_id}",
    )
    logger.info("Scheduled product %s every %d min.", product_id, interval_minutes)


def unschedule_product(product_id: str) -> None:
    """Remove the price-check job for a product (if it exists)."""
    job_id = f"product_{product_id}"
    if _scheduler.get_job(job_id):
        _scheduler.remove_job(job_id)
        logger.info("Unscheduled product %s.", product_id)


async def reload_all_products() -> None:
    """
    Re-register all tracked products from the database on startup.
    Ensures jobs survive a server restart.
    """
    from db.database import get_database

    db = get_database()
    async for product in db["products"].find({}):
        pid = str(product["_id"])
        interval = product.get("check_interval_minutes", 60)
        schedule_product(pid, interval)

    logger.info("All product schedules reloaded from database.")


def start_scheduler() -> None:
    """Start the scheduler (idempotent)."""
    if not _scheduler.running:
        _scheduler.start()
        logger.info("APScheduler started.")


def stop_scheduler() -> None:
    """Shut down the scheduler gracefully."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
