import json
from services.azure_openai import chat_complete

SYSTEM_PROMPT_TEMPLATE = (
    "You are UniMind's knowledge agent — a sharp, fast-moving AI interviewer. "
    "Your mission: learn what makes this user unique in 6-8 exchanges maximum. "
    "Build their digital agent profile for life simulation accuracy.\n\n"
    "Rules:\n"
    "1. Ask ONE sharp, direct question per reply. Under 80 words total.\n"
    "2. Combine 2 related things in one question when natural "
    "(e.g. 'What are you building and what's blocking you right now?').\n"
    "3. Cover these in order: identity → goals → skills → biggest fear/obstacle.\n"
    "4. Be warm and direct — not corporate. Use their name once early.\n"
    "5. After 6-8 exchanges OR when you have 5+ knowledge chunks, say EXACTLY: "
    "'Your agent profile is ready — the UniMind web now knows you.' "
    "then give a 3-bullet summary of what you learned.\n"
    "6. Never repeat a question already asked.\n\n"
    "Current user: {name}\n"
    "Knowledge collected so far ({chunk_count} chunks): {knowledge_summary}"
)

EXTRACT_PROMPT_TEMPLATE = (
    "Extract knowledge from this user message for their UniMind agent profile.\n"
    "User said: \"{user_message}\"\n\n"
    "Return valid JSON only, no extra text:\n"
    '{{"should_save": true/false, "category": "skill|experience|goal|fear|general", '
    '"content": "concise 1-2 sentence knowledge statement"}}\n\n'
    "Only save if the user shared something concrete and personal. "
    "Return should_save=false for vague, short, or one-word responses."
)

OPENING_MESSAGE = (
    "Hey! I'm your UniMind knowledge agent. I'll build your digital profile in 6-8 quick questions — "
    "the sharper your answers, the more accurate your life simulations. "
    "Let's go: what's your name, and what are you currently obsessed with building or figuring out?"
)


async def extract_knowledge(user_message: str) -> dict | None:
    """Returns {should_save, category, content} or None on parse failure."""
    prompt = EXTRACT_PROMPT_TEMPLATE.format(user_message=user_message)
    try:
        raw = await chat_complete(
            [{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        # Strip markdown fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        if result.get("should_save") and result.get("content"):
            return result
    except Exception:
        pass
    return None


def build_system_prompt(name: str, chunks: list[dict]) -> str:
    chunk_count = len(chunks)
    if chunk_count == 0:
        knowledge_summary = "none yet"
    else:
        lines = [f"- [{c['category']}] {c['content']}" for c in chunks[-10:]]
        knowledge_summary = "\n".join(lines)
    return SYSTEM_PROMPT_TEMPLATE.format(
        name=name,
        chunk_count=chunk_count,
        knowledge_summary=knowledge_summary,
    )


async def build_agent_bio(name: str, chunks: list[dict]) -> str:
    """Generate a 2-sentence agent bio from accumulated knowledge chunks."""
    if not chunks:
        return ""
    chunk_text = "\n".join(f"- [{c['category']}] {c['content']}" for c in chunks[:12])
    prompt = (
        f"Based on these knowledge chunks about {name}, write a 2-sentence agent bio "
        "in UniMind's style: cosmic, data-driven, confident. "
        "Focus on what makes them unique in the network.\n\n"
        f"Knowledge:\n{chunk_text}"
    )
    try:
        return await chat_complete([{"role": "user", "content": prompt}], temperature=0.7)
    except Exception:
        return f"{name} · Emerging agent in the UniMind knowledge web."
