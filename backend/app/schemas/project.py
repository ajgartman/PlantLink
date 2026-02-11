from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    plant_id: UUID
    contractor_id: UUID
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    plant_id: UUID
    contractor_id: UUID
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True