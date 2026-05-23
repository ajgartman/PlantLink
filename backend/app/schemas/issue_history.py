from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.schemas.user import MinUserResponse


class IssueHistoryResponse(BaseModel):
    id: UUID
    issue_id: UUID
    user_id: UUID
    field_changed: str
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime
    user: Optional[MinUserResponse] = None

    class Config:
        from_attributes = True
