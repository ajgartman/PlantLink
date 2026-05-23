from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional


class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "operator"


class InviteResponse(BaseModel):
    id: UUID
    email: str
    role: str
    token: str
    expires_at: datetime
    used: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InviteInfo(BaseModel):
    """Public info returned when validating an invite token."""
    email: str
    role: str
    company_name: str
    company_type: str
    expires_at: datetime


class InviteRegister(BaseModel):
    """Registration data when accepting an invite."""
    token: str
    password: str
    full_name: str
