from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str  # "low", "medium", "high", "critical"
    location: Optional[str] = None
    project_id: UUID
    assigned_to_id: Optional[UUID] = None
    due_date: Optional[datetime] = None


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # "new", "assigned", "in_progress", "resolved", "closed"
    priority: Optional[str] = None
    location: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class IssueResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    location: Optional[str]
    project_id: UUID
    created_by_id: UUID
    assigned_to_id: Optional[UUID]
    due_date: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True