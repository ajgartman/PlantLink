from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class IssuePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IssueStatus(str, enum.Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Issue(Base):
    __tablename__ = "issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    # Status and Priority
    status = Column(SQLEnum(IssueStatus), default=IssueStatus.NEW, nullable=False)
    priority = Column(SQLEnum(IssuePriority), default=IssuePriority.MEDIUM, nullable=False)

    # Location
    location = Column(String(255), nullable=True)

    # Foreign Keys
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # Dates
    due_date = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    project = relationship("Project")
    created_by = relationship("User", foreign_keys=[created_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")