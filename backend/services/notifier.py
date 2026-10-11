"""
services/notifier.py — Multi-channel notification dispatcher.

Channels:
  • Web Push (pywebpush / VAPID)
  • Email    (SendGrid)
  • Telegram (python-telegram-bot)

Each channel degrades gracefully when the relevant API key is absent.
"""

import json
import logging
from typing import Any

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ─── Web Push ─────────────────────────────────────────────────────────────────

async def send_web_push(subscription: dict, payload: dict) -> bool:
    """
    Send a Web Push notification to a single browser subscription.

    Args:
        subscription: dict with keys ``endpoint``, ``keys`` (p256dh, auth).
        payload:      JSON-serialisable notification body.

    Returns:
        True on success, False on failure.
    """
    if not settings.vapid_private_key or not settings.vapid_public_key:
        logger.warning("VAPID keys not configured — skipping Web Push.")
        return False

    try:
        from pywebpush import webpush, WebPushException  # type: ignore

        webpush(
            subscription_info=subscription,
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={
                "sub": f"mailto:{settings.vapid_claims_email}",
            },
        )
        logger.info("Web Push sent to %s", subscription.get("endpoint", "")[:60])
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Web Push failed: %s", exc)
        return False


# ─── Email (SendGrid) ─────────────────────────────────────────────────────────

async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email via SendGrid.

    Returns:
        True on success, False on failure.
    """
    if not settings.sendgrid_api_key:
        logger.warning("SendGrid API key not configured — skipping email.")
        return False

    try:
        from sendgrid import SendGridAPIClient  # type: ignore
        from sendgrid.helpers.mail import Mail  # type: ignore

        message = Mail(
            from_email=settings.vapid_claims_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_body,
        )
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)
        logger.info(
            "Email sent to %s — status %s", to_email, response.status_code
        )
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("SendGrid email failed: %s", exc)
        return False


# ─── Telegram ─────────────────────────────────────────────────────────────────

async def send_telegram(chat_id: str, message: str) -> bool:
    """
    Send a plain-text Telegram message.

    Returns:
        True on success, False on failure.
    """
    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token not configured — skipping Telegram.")
        return False

    try:
        from telegram import Bot  # type: ignore

        bot = Bot(token=settings.telegram_bot_token)
        await bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")
        logger.info("Telegram message sent to chat_id=%s", chat_id)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Telegram send failed: %s", exc)
        return False


# ─── Orchestrator ─────────────────────────────────────────────────────────────

async def send_price_drop_notification(
    product: dict, new_price: float, user: dict
) -> None:
    """
    Dispatch a price-drop alert to all enabled notification channels for a user.

    Args:
        product:   MongoDB product document.
        new_price: The newly detected (lower) price.
        user:      MongoDB user document (must contain notification prefs).
    """
    product_name = product.get("name") or product.get("url", "A product")
    old_price = product.get("current_price") or product.get("original_price")
    currency = product.get("currency", "INR")

    # Build human-readable price string
    symbol = "₹" if currency == "INR" else currency
    price_str = f"{symbol}{new_price:,.2f}"

    drop_str = ""
    if old_price and old_price > new_price:
        drop_pct = (old_price - new_price) / old_price * 100
        drop_str = f" (↓{drop_pct:.1f}% from {symbol}{old_price:,.2f})"

    product_url = product.get("url", "")

    prefs: dict[str, Any] = user.get("notification_prefs", {})

    # ── Web Push ──────────────────────────────────────────────────────────────
    if prefs.get("web_push_enabled", True):
        push_payload = {
            "title": "🎉 Price Drop Alert!",
            "body": f"{product_name} is now {price_str}{drop_str}",
            "url": product_url,
            "icon": "/icon.png",
        }
        for sub in user.get("push_subscriptions", []):
            await send_web_push(sub, push_payload)

    # ── Email ─────────────────────────────────────────────────────────────────
    if prefs.get("email_enabled", True):
        user_email = user.get("email")
        if user_email:
            html_body = f"""
            <h2>🎉 Price Drop Alert — PriceHawk</h2>
            <p>Good news! The price of <strong>{product_name}</strong> has dropped.</p>
            <table style="border-collapse:collapse;">
              <tr><td style="padding:4px 12px 4px 0"><strong>New Price</strong></td>
                  <td>{price_str}{drop_str}</td></tr>
              <tr><td style="padding:4px 12px 4px 0"><strong>Product</strong></td>
                  <td><a href="{product_url}">{product_name}</a></td></tr>
            </table>
            <p><a href="{product_url}" style="background:#0ea5e9;color:#fff;padding:10px 20px;
               border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px;">
               View Product →</a></p>
            <hr/>
            <small>PriceHawk — you're tracking {product_url}</small>
            """
            await send_email(
                to_email=user_email,
                subject=f"Price Drop: {product_name} is now {price_str}",
                html_body=html_body,
            )

    # ── Telegram ──────────────────────────────────────────────────────────────
    if prefs.get("telegram_enabled", False):
        chat_id = prefs.get("telegram_chat_id")
        if chat_id:
            msg = (
                f"🎉 <b>Price Drop Alert!</b>\n\n"
                f"<b>{product_name}</b>\n"
                f"New price: <b>{price_str}</b>{drop_str}\n\n"
                f'<a href="{product_url}">View Product →</a>'
            )
            await send_telegram(chat_id, msg)
