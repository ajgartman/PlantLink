from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str | None = None

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    company_name: str | None
    role: str
    is_active: bool
    created_at: datetime

class Config:
    from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str