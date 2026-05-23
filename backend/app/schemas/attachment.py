from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.schemas.user import MinUserResponse


class AttachmentResponse(BaseModel):
    id: UUID
    issue_id: UUID
    filename: str
    url: str
    content_type: str
    size_bytes: int
    uploaded_by: Optional[MinUserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True
