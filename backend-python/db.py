import os
import aiosqlite
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "./unimind.db")

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    focus TEXT,
    goal TEXT,
    fear TEXT,
    agent_bio TEXT DEFAULT '',
    agent_skills TEXT DEFAULT '[]',
    agent_score INTEGER DEFAULT 100,
    onboarding_complete INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    category TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    agent_icon TEXT NOT NULL,
    agent_type INTEGER NOT NULL,
    agent_score INTEGER NOT NULL,
    content TEXT NOT NULL,
    tag TEXT NOT NULL,
    user_id TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reactions (
    post_id TEXT NOT NULL REFERENCES posts(id),
    emoji TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (post_id, emoji)
);

CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    badge_key TEXT NOT NULL,
    earned_at TEXT NOT NULL
);
"""


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def create_tables():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(CREATE_TABLES_SQL)
        await db.commit()
