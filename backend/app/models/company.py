from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class CompanyType(str, enum.Enum):
    PLANT = "plant"
    CONTRACTOR = "contractor"


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    company_type = Column(SQLEnum(CompanyType), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships (we'll add these as we create other models)
    # users = relationship("User", back_populates="company")
    # projects_as_plant = relationship("Project", foreign_keys="Project.plant_id", back_populates="plant")
    # projects_as_contractor = relationship("Project", foreign_keys="Project.contractor_id", back_populates="contractor")