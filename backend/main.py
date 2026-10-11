"""
main.py — PriceHawk FastAPI application entry point.

Responsibilities:
  • Mount all routers.
  • Configure CORS for local frontend dev (localhost:5173).
  • WebSocket endpoint for real-time price-update streaming.
  • Startup: DB indexes, Playwright browser, APScheduler jobs.
  • Shutdown: close browser, stop scheduler.
  • Health check.
"""

import asyncio
import json
import logging
import logging.config
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from db.database import close_db, connect_db
from routes.auth import router as auth_router
from routes.compare import router as compare_router
from routes.discover import router as discover_router
from routes.notifications import router as notifications_router
from routes.products import router as products_router
from services.scheduler import reload_all_products, start_scheduler, stop_scheduler
from services.scraper import scraper

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


# ─── WebSocket connection manager ─────────────────────────────────────────────

class ConnectionManager:
    """Tracks active WebSocket connections keyed by user_id."""

    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(user_id, []).append(ws)
        logger.info("WS connected: user_id=%s  total=%d", user_id, self.count)

    def disconnect(self, user_id: str, ws: WebSocket) -> None:
        sockets = self._connections.get(user_id, [])
        if ws in sockets:
            sockets.remove(ws)
        if not sockets:
            self._connections.pop(user_id, None)
        logger.info("WS disconnected: user_id=%s", user_id)

    async def send_to_user(self, user_id: str, data: Any) -> None:
        """Send a JSON message to all active connections for a given user."""
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                pass  # stale connection — will be cleaned up on disconnect

    @property
    def count(self) -> int:
        return sum(len(v) for v in self._connections.values())


ws_manager = ConnectionManager()


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle hooks."""
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("PriceHawk starting up…")
    await connect_db()
    await scraper.start()
    start_scheduler()
    await reload_all_products()
    logger.info("PriceHawk ready.")

    yield  # application runs here

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("PriceHawk shutting down…")
    stop_scheduler()
    await scraper.stop()
    await close_db()
    logger.info("PriceHawk stopped.")


# ─── Application factory ──────────────────────────────────────────────────────

app = FastAPI(
    title="PriceHawk API",
    description="Backend for the PriceHawk price monitoring application.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(discover_router)
app.include_router(compare_router)
app.include_router(notifications_router)


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
async def health_check() -> dict:
    """Simple liveness probe."""
    return {"status": "ok", "service": "pricehawk-api"}


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str) -> None:
    """
    Real-time price update stream for a specific user.

    The client connects here after authentication.  The server pushes
    ``price_update`` events whenever a scheduled check detects a change.

    Clients can also send ``{"type": "ping"}`` to keep the connection alive.
    """
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except asyncio.TimeoutError:
                # Send a server-side heartbeat so proxies don't close the connection
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
    except Exception as exc:
        logger.warning("WebSocket error for user %s: %s", user_id, exc)
        ws_manager.disconnect(user_id, websocket)
