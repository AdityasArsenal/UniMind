from pydantic import BaseModel
from typing import Optional, List


class ChatMessageIn(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: str


class KnowledgeChunkIn(BaseModel):
    content: str
    category: str


class KnowledgeChunkOut(BaseModel):
    id: str
    content: str
    category: str
    created_at: str


class ProfileUpdate(BaseModel):
    bio: str
    skills: List[str]
    chunks_saved: int


class ChatResponse(BaseModel):
    message: ChatMessageOut
    profile_update: Optional[ProfileUpdate] = None
