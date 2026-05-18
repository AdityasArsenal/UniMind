import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from db import get_db
from auth import get_current_user
from models.chat import (
    ChatMessageIn, ChatMessageOut, KnowledgeChunkIn, KnowledgeChunkOut,
    ChatResponse, ProfileUpdate,
)
from services.chatbot_service import (
    OPENING_MESSAGE,
    build_system_prompt,
    extract_knowledge,
    build_agent_bio,
)
from services.azure_openai import chat_complete

router = APIRouter()


async def _get_history(db, user_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT role, content FROM chat_messages WHERE user_id=? ORDER BY created_at ASC LIMIT 40",
        (user_id,),
    )
    rows = await cursor.fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in rows]


async def _get_chunks(db, user_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT content, category FROM knowledge_chunks WHERE user_id=? ORDER BY created_at ASC",
        (user_id,),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def _save_message(db, user_id: str, role: str, content: str) -> str:
    msg_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (msg_id, user_id, role, content, created_at),
    )
    return created_at


async def _save_chunk(db, user_id: str, content: str, category: str) -> None:
    chunk_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO knowledge_chunks (id, user_id, content, category, created_at) VALUES (?, ?, ?, ?, ?)",
        (chunk_id, user_id, content, category, created_at),
    )


@router.post("/message", response_model=ChatResponse)
async def send_message(
    payload: ChatMessageIn,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user["id"]
    user_name = current_user["name"]

    history = await _get_history(db, user_id)

    # First-ever message: return canned greeting (idempotent — only save if none exists)
    if not history:
        # Check again with a fresh query to guard against concurrent double-init requests
        cursor2 = await db.execute(
            "SELECT id FROM chat_messages WHERE user_id=? LIMIT 1", (user_id,)
        )
        already_exists = await cursor2.fetchone()
        if not already_exists:
            created_at = await _save_message(db, user_id, "assistant", OPENING_MESSAGE)
            await db.commit()
        else:
            # Concurrent request already saved the greeting — just return it
            created_at = datetime.now(timezone.utc).isoformat()
        return ChatResponse(
            message=ChatMessageOut(
                role="assistant",
                content=OPENING_MESSAGE,
                created_at=created_at,
            ),
            profile_update=None,
        )

    # Save user message
    user_created_at = await _save_message(db, user_id, "user", payload.content)

    # Fetch knowledge chunks for context
    chunks = await _get_chunks(db, user_id)

    # Build messages for LLM
    system_content = build_system_prompt(user_name, chunks)
    messages = [{"role": "system", "content": system_content}]
    messages.extend(history)
    messages.append({"role": "user", "content": payload.content})

    # LLM response
    assistant_reply = await chat_complete(messages, temperature=0.8)

    # Save assistant response
    assistant_created_at = await _save_message(db, user_id, "assistant", assistant_reply)

    # Knowledge extraction (non-blocking)
    profile_update = None
    try:
        extracted = await extract_knowledge(payload.content)
        if extracted and extracted.get("should_save"):
            await _save_chunk(db, user_id, extracted["content"], extracted.get("category", "general"))
            all_chunks = await _get_chunks(db, user_id)
            new_bio = await build_agent_bio(user_name, all_chunks)
            skills = [c["content"] for c in all_chunks if c["category"] == "skill"][:8]
            await db.execute(
                "UPDATE users SET agent_bio=?, agent_skills=? WHERE id=?",
                (new_bio, json.dumps(skills), user_id),
            )
            profile_update = ProfileUpdate(
                bio=new_bio,
                skills=skills,
                chunks_saved=len(all_chunks),
            )
    except Exception:
        pass

    await db.commit()

    return ChatResponse(
        message=ChatMessageOut(
            role="assistant",
            content=assistant_reply,
            created_at=assistant_created_at,
        ),
        profile_update=profile_update,
    )


@router.get("/history", response_model=list[ChatMessageOut])
async def get_history(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    cursor = await db.execute(
        "SELECT role, content, created_at FROM chat_messages WHERE user_id=? ORDER BY created_at ASC",
        (current_user["id"],),
    )
    rows = await cursor.fetchall()
    return [ChatMessageOut(role=r["role"], content=r["content"], created_at=r["created_at"]) for r in rows]


@router.post("/knowledge", response_model=KnowledgeChunkOut)
async def save_knowledge(
    payload: KnowledgeChunkIn,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    if payload.category not in {"skill", "experience", "goal", "fear", "general"}:
        raise HTTPException(status_code=400, detail="Invalid category")

    chunk_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    await db.execute(
        "INSERT INTO knowledge_chunks (id, user_id, content, category, created_at) VALUES (?, ?, ?, ?, ?)",
        (chunk_id, current_user["id"], payload.content, payload.category, created_at),
    )
    await db.commit()

    return KnowledgeChunkOut(
        id=chunk_id,
        content=payload.content,
        category=payload.category,
        created_at=created_at,
    )
