from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Foreign Keys
    plant_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False)
    contractor_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    plant = relationship("Company", foreign_keys=[plant_id])
    contractor = relationship("Company", foreign_keys=[contractor_id])
    # issues = relationship("Issue", back_populates="project")