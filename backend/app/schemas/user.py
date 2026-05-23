from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str
    company_type: str = "plant"
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    company_name: str | None
    role: str
    is_active: bool
    created_at: datetime

class MinUserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str


class Config:
    from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    full_name: str
    email: str
    role: str
