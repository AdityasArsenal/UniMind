import json

from fastapi import APIRouter, Depends

from db import get_db
from auth import get_current_user
from services.azure_openai import simulate_life

router = APIRouter()

_FALLBACK = {
    "paths": [
        {
            "title": "The Builder",
            "icon": "🏗",
            "probability": 45,
            "tagline": "You ship something the world uses.",
            "milestones": [
                {"month": 1, "event": "Define your core idea and validate it"},
                {"month": 3, "event": "Ship MVP to first 50 users"},
                {"month": 6, "event": "Full-time founder with real traction"},
            ],
            "agent_match": "ARIA — shares your builder trajectory and career-switch energy",
        },
        {
            "title": "The Scholar",
            "icon": "📚",
            "probability": 35,
            "tagline": "You become the world's authority on what you love.",
            "milestones": [
                {"month": 1, "event": "Commit to one domain and go deep"},
                {"month": 3, "event": "Publish your first original insight"},
                {"month": 6, "event": "Recognized expert with a growing network"},
            ],
            "agent_match": "VEDA — mastered the research-to-impact pipeline before you",
        },
        {
            "title": "The Explorer",
            "icon": "🌍",
            "probability": 20,
            "tagline": "You move to where the opportunity is.",
            "milestones": [
                {"month": 1, "event": "Research and apply to target opportunities abroad"},
                {"month": 3, "event": "Secure a position or program"},
                {"month": 6, "event": "Settled in new environment, network growing fast"},
            ],
            "agent_match": "NOX — navigated the leap from local to global",
        },
    ],
    "collective_insight": "The network has spoken — your signal is clear. Move.",
}


@router.post("/simulate")
async def run_simulation(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    # Gather knowledge chunks to personalise the simulation
    cursor = await db.execute(
        "SELECT content, category FROM knowledge_chunks WHERE user_id = ? ORDER BY created_at DESC LIMIT 15",
        (current_user["id"],),
    )
    rows = await cursor.fetchall()
    knowledge = "\n".join(
        f"- [{row['category'] or 'general'}] {row['content']}" for row in rows
    ) if rows else ""

    user_profile = {
        "name": current_user.get("name"),
        "bio": current_user.get("agent_bio") or "",
        "score": current_user.get("agent_score", 100),
        "knowledge": knowledge,
    }
    onboarding = {
        "focus": current_user.get("focus") or "exploring",
        "goal": current_user.get("goal") or "personal growth",
        "fear": current_user.get("fear") or "uncertainty",
    }

    result_text = await simulate_life(user_profile, onboarding)

    # Parse structured JSON from LLM; fall back to static template if malformed
    try:
        raw = result_text.strip()
        # Strip markdown code fences if present
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                candidate = part.strip()
                if candidate.startswith("json"):
                    candidate = candidate[4:].strip()
                if candidate.startswith("{"):
                    raw = candidate
                    break
        simulation = json.loads(raw.strip())
        # Validate required structure
        if "paths" not in simulation or not isinstance(simulation["paths"], list):
            raise ValueError("missing paths")
    except Exception:
        simulation = _FALLBACK

    return {"simulation": simulation, "knowledge_count": len(rows)}
