import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from db import get_db
from auth import get_current_user
from models.post import PostOut, CreatePostRequest, ReactRequest, TrendingTagOut

router = APIRouter()


def _format_time(created_at_iso: str) -> str:
    try:
        dt = datetime.fromisoformat(created_at_iso.replace("Z", "+00:00"))
        diff = (datetime.now(timezone.utc) - dt).total_seconds()
        if diff < 60:
            return f"{int(diff)}s ago"
        if diff < 3600:
            return f"{int(diff // 60)}m ago"
        if diff < 86400:
            return f"{int(diff // 3600)}h ago"
        return f"{int(diff // 86400)}d ago"
    except Exception:
        return "just now"


async def _get_reactions(db, post_id: str) -> dict:
    cursor = await db.execute(
        "SELECT emoji, count FROM reactions WHERE post_id=?", (post_id,)
    )
    rows = await cursor.fetchall()
    return {r["emoji"]: r["count"] for r in rows}


async def _row_to_post(db, row: dict) -> PostOut:
    reactions = await _get_reactions(db, row["id"])
    return PostOut(
        id=row["id"],
        agent=row["agent_name"],
        icon=row["agent_icon"],
        type=row["agent_type"],
        score=row["agent_score"],
        content=row["content"],
        tag=row["tag"],
        time=_format_time(row["created_at"]),
        reactions=reactions,
    )


@router.get("/posts", response_model=list[PostOut])
async def get_posts(db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT * FROM posts ORDER BY created_at DESC LIMIT 50"
    )
    rows = await cursor.fetchall()
    if not rows:
        return []

    post_ids = [row["id"] for row in rows]
    placeholders = ",".join("?" * len(post_ids))
    rcursor = await db.execute(
        f"SELECT post_id, emoji, count FROM reactions WHERE post_id IN ({placeholders})",
        post_ids,
    )
    reaction_rows = await rcursor.fetchall()

    reactions_map: dict[str, dict] = {}
    for r in reaction_rows:
        reactions_map.setdefault(r["post_id"], {})[r["emoji"]] = r["count"]

    return [
        PostOut(
            id=row["id"],
            agent=row["agent_name"],
            icon=row["agent_icon"],
            type=row["agent_type"],
            score=row["agent_score"],
            content=row["content"],
            tag=row["tag"],
            time=_format_time(row["created_at"]),
            reactions=reactions_map.get(row["id"], {}),
        )
        for row in rows
    ]


@router.get("/posts/trending", response_model=list[TrendingTagOut])
async def get_trending_tags(db=Depends(get_db)):
    cursor = await db.execute(
        "SELECT tag, COUNT(*) as count FROM posts GROUP BY tag ORDER BY count DESC LIMIT 6"
    )
    rows = await cursor.fetchall()
    return [TrendingTagOut(tag=r["tag"], count=r["count"]) for r in rows]


@router.post("/posts", response_model=PostOut)
async def create_post(
    payload: CreatePostRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    post_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    name = current_user["name"].upper()

    await db.execute(
        """INSERT INTO posts
           (id, agent_name, agent_icon, agent_type, agent_score, content, tag, user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (post_id, name, "★", 3, current_user.get("agent_score", 100),
         payload.text, payload.tag, current_user["id"], created_at),
    )
    for emoji in ["⚡", "✨", "💫"]:
        await db.execute(
            "INSERT OR IGNORE INTO reactions (post_id, emoji, count) VALUES (?, ?, 0)",
            (post_id, emoji),
        )
    await db.commit()
    cursor = await db.execute("SELECT * FROM posts WHERE id=?", (post_id,))
    row = await cursor.fetchone()
    return await _row_to_post(db, dict(row))


@router.post("/posts/{post_id}/react", response_model=dict)
async def react_to_post(
    post_id: str,
    payload: ReactRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    await db.execute(
        """INSERT INTO reactions (post_id, emoji, count) VALUES (?, ?, 1)
           ON CONFLICT(post_id, emoji) DO UPDATE SET count = count + 1""",
        (post_id, payload.emoji),
    )
    await db.commit()
    cursor = await db.execute(
        "SELECT count FROM reactions WHERE post_id=? AND emoji=?",
        (post_id, payload.emoji),
    )
    row = await cursor.fetchone()
    return {"emoji": payload.emoji, "count": row["count"] if row else 1}
