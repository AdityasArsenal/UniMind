from fastapi import APIRouter, Depends

from db import get_db
from auth import get_current_user

router = APIRouter()

DEFAULT_BADGES = [
    {"key": "first_node", "icon": "★",  "label": "First Node",  "desc": "You joined the web",   "color": "#FFD54F"},
    {"key": "seer",       "icon": "🔮", "label": "Seer",         "desc": "Run 1 simulation",     "color": "#B388FF"},
    {"key": "connected",  "icon": "🌐", "label": "Connected",    "desc": "Link to 10 agents",    "color": "#4FC3F7"},
    {"key": "signal",     "icon": "⚡", "label": "Signal",       "desc": "Phase 1 complete",     "color": "#00D1FF"},
    {"key": "evolution",  "icon": "🧬", "label": "Evolution",    "desc": "Run 10 simulations",   "color": "#B388FF"},
    {"key": "diamond",    "icon": "💎", "label": "Diamond",      "desc": "Score 1000+",          "color": "#E3F2FD"},
]


@router.get("/achievements/{user_id}")
async def get_achievements(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    cursor = await db.execute(
        "SELECT badge_key FROM achievements WHERE user_id=?", (user_id,)
    )
    rows = await cursor.fetchall()
    earned_keys = {r["badge_key"] for r in rows}
    # first_node is always earned for any existing account
    earned_keys.add("first_node")
    return [{**b, "earned": b["key"] in earned_keys} for b in DEFAULT_BADGES]
