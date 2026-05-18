from fastapi import APIRouter, Query

from services.agent_seed import AGENTS
from models.agent import AgentOut

router = APIRouter()


@router.get("/agents", response_model=list[AgentOut])
async def list_agents(page: int = Query(1, ge=1), size: int = Query(100, ge=1, le=500)):
    start = (page - 1) * size
    end = start + size
    return [AgentOut(**a) for a in AGENTS[start:end]]


@router.get("/agents/search", response_model=list[AgentOut])
async def search_agents(q: str = Query("", min_length=1)):
    q_lower = q.lower()
    results = [
        AgentOut(**a)
        for a in AGENTS
        if q_lower in a["name"].lower() or q_lower in a["full_name"].lower()
    ]
    return results[:20]
