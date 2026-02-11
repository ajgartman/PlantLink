from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional


class CompanyCreate(BaseModel):
    name: str
    company_type: str  # "plant" or "contractor"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    company_type: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True