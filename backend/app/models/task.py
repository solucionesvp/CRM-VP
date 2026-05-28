from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
from app.models.enums import TaskType, TaskStatus, TaskPriority

class Task(Base):
    __tablename__ = "tasks"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    contact_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True
    )
    opportunity_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("opportunities.id", ondelete="SET NULL"),
        nullable=True
    )
    title = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    task_type = sa.Column(
        sa.Enum(TaskType, name="tasktype"),
        nullable=False,
        default=TaskType.general
    )
    status = sa.Column(
        sa.Enum(TaskStatus, name="taskstatus"),
        nullable=False,
        default=TaskStatus.pending
    )
    priority = sa.Column(
        sa.Enum(TaskPriority, name="taskpriority"),
        nullable=False,
        default=TaskPriority.medium
    )
    due_date = sa.Column(sa.DateTime(timezone=True), nullable=True)
    completed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    contact = relationship("Contact", back_populates="tasks")
    opportunity = relationship("Opportunity", back_populates="tasks")

# Dynamically link back_populates relationships on target models
from app.models.contact import Contact
from app.models.opportunity import Opportunity

Contact.tasks = relationship("Task", back_populates="contact")
Opportunity.tasks = relationship("Task", back_populates="opportunity")
