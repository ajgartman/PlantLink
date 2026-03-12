from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id:         UUID
    issue_id:   UUID
    user_id:    UUID
    content:    str
    created_at: datetime
    updated_at: datetime
    user:       UserResponse

    class Config:
        from_attributes = True