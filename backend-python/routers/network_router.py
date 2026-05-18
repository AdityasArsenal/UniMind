from fastapi import APIRouter, Query

from services.agent_seed import AGENTS

router = APIRouter()

GROWTH_DATA = {
    "past": {
        "label": "Past Month",
        "count": 1129,
        "delta": "+56%",
        "growth": [820, 880, 950, 1020, 1129],
    },
    "this": {
        "label": "This Month",
        "count": 1763,
        "delta": "+56%",
        "growth": [1129, 1280, 1450, 1620, 1763],
    },
    "all": {
        "label": "All Time",
        "count": 2847,
        "delta": "+23608%",
        "growth": [12, 144, 380, 820, 1129, 1763, 2847],
    },
}


@router.get("/network/growth")
async def get_network_growth(timeframe: str = Query("this")):
    data = GROWTH_DATA.get(timeframe, GROWTH_DATA["this"])
    return data


@router.get("/leaderboard")
async def get_leaderboard():
    top = sorted(AGENTS, key=lambda a: a["score"], reverse=True)[:12]
    return [
        {
            "rank": i + 1,
            "idx": a["idx"],
            "name": a["name"],
            "full_name": a["full_name"],
            "icon": a["icon"],
            "score": a["score"],
            "type": a["type"],
        }
        for i, a in enumerate(top)
    ]
