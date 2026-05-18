from pydantic import BaseModel


class AgentOut(BaseModel):
    idx: int
    name: str
    full_name: str
    type: int
    icon: str
    bio: str
    score: int
