from pydantic import BaseModel
from typing import Dict


class PostOut(BaseModel):
    id: str
    agent: str
    icon: str
    type: int
    score: int
    content: str
    tag: str
    time: str
    reactions: Dict[str, int]


class CreatePostRequest(BaseModel):
    text: str
    tag: str


class ReactRequest(BaseModel):
    emoji: str
