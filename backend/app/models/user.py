from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(500), nullable=False)
    full_name = Column(String(255), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=True)
    company_name = Column(String(255), nullable=True)
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now())
    updated_at = Column(DateTime, default=datetime.now(), onupdate=datetime.now)
    #Relationships
    company = relationship("Company")