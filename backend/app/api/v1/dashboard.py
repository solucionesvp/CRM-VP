from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
import sqlalchemy as sa
from sqlalchemy import func, case, distinct
from datetime import datetime, time, timezone
from uuid import UUID
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel

from app.database.session import get_db
from app.models.task import Task
from app.models.opportunity import Opportunity
from app.models.contact import Contact
from app.models.opportunity_activity import OpportunityActivity
from app.models.pipeline import Pipeline
from app.models.opportunity_stage import OpportunityStage
from app.models.enums import TaskStatus, TaskPriority, OpportunityStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# Helper function to check if a due date is in the past
def is_task_overdue(due_date: Optional[datetime], now_val: datetime) -> bool:
    if not due_date:
        return False
    # Handle mixed offset-naive and offset-aware comparisons
    if due_date.tzinfo is None and now_val.tzinfo is not None:
        now_val = now_val.replace(tzinfo=None)
    elif due_date.tzinfo is not None and now_val.tzinfo is None:
        due_date = due_date.replace(tzinfo=None)
    return due_date < now_val


# --- PYDANTIC SCHEMAS ---

class PipelineSummary(BaseModel):
    id: int
    name: str
    open_count: int
    open_value: float

    class Config:
        from_attributes = True


class StageSummary(BaseModel):
    stage_name: str
    count: int

    class Config:
        from_attributes = True


class DashboardSummaryResponse(BaseModel):
    overdue_tasks: int
    today_tasks: int
    open_opportunities: int
    open_value: float
    active_contacts: int
    won_opportunities: int
    lost_opportunities: int
    pipelines: List[PipelineSummary]
    stages: List[StageSummary]


class DashboardTaskItem(BaseModel):
    id: int
    title: str
    task_type: str
    priority: str
    due_date: Optional[datetime] = None
    status: str
    is_overdue: bool
    contact_id: Optional[UUID] = None
    contact_name: Optional[str] = None
    opportunity_id: Optional[UUID] = None
    opportunity_title: Optional[str] = None

    class Config:
        from_attributes = True


class DashboardTodayResponse(BaseModel):
    overdue: List[DashboardTaskItem]
    today: List[DashboardTaskItem]


class DashboardActivityItem(BaseModel):
    id: UUID
    opportunity_id: UUID
    opportunity_title: Optional[str] = None
    action_type: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- ENDPOINTS ---

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)
    start_of_today = datetime.combine(now_utc.date(), time.min, tzinfo=timezone.utc)
    end_of_today = datetime.combine(now_utc.date(), time.max, tzinfo=timezone.utc)

    # 1. Overdue tasks count
    overdue_tasks = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.pending,
        Task.due_date < now_utc
    ).scalar() or 0

    # 2. Today's tasks count
    today_tasks = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.pending,
        Task.due_date >= start_of_today,
        Task.due_date <= end_of_today
    ).scalar() or 0

    # 3. Opportunity metrics
    opp_stats = db.query(
        func.count(case((Opportunity.status == OpportunityStatus.active, 1))).label("open_opportunities"),
        func.coalesce(func.sum(case((Opportunity.status == OpportunityStatus.active, Opportunity.expected_value), else_=0)), 0).label("open_value"),
        func.count(distinct(case((Opportunity.status == OpportunityStatus.active, Opportunity.contact_id)))).label("active_contacts"),
        func.count(case((Opportunity.status == OpportunityStatus.won, 1))).label("won_opportunities"),
        func.count(case((Opportunity.status == OpportunityStatus.lost, 1))).label("lost_opportunities")
    ).filter(Opportunity.deleted_at.is_(None)).first()

    open_opportunities = opp_stats.open_opportunities if opp_stats else 0
    open_value = float(opp_stats.open_value) if opp_stats else 0.0
    active_contacts = opp_stats.active_contacts if opp_stats else 0
    won_opportunities = opp_stats.won_opportunities if opp_stats else 0
    lost_opportunities = opp_stats.lost_opportunities if opp_stats else 0

    # 4. Pipelines data
    pipelines_data = (
        db.query(
            Pipeline.id,
            Pipeline.name,
            func.count(Opportunity.id).label("open_count"),
            func.coalesce(func.sum(Opportunity.expected_value), 0).label("open_value")
        )
        .join(Opportunity, Pipeline.id == Opportunity.pipeline_id)
        .filter(
            Opportunity.status == OpportunityStatus.active,
            Opportunity.deleted_at.is_(None)
        )
        .group_by(Pipeline.id, Pipeline.name)
        .all()
    )

    pipelines = [
        PipelineSummary(
            id=row.id,
            name=row.name,
            open_count=row.open_count,
            open_value=float(row.open_value)
        )
        for row in pipelines_data
    ]

    # 5. Stages data
    stages_data = (
        db.query(
            OpportunityStage.name.label("stage_name"),
            func.count(Opportunity.id).label("count")
        )
        .join(Opportunity, OpportunityStage.id == Opportunity.stage_id)
        .filter(
            Opportunity.status == OpportunityStatus.active,
            Opportunity.deleted_at.is_(None)
        )
        .group_by(OpportunityStage.id, OpportunityStage.name)
        .order_by(func.count(Opportunity.id).desc())
        .limit(10)
        .all()
    )

    stages = [
        StageSummary(
            stage_name=row.stage_name,
            count=row.count
        )
        for row in stages_data
    ]

    return DashboardSummaryResponse(
        overdue_tasks=overdue_tasks,
        today_tasks=today_tasks,
        open_opportunities=open_opportunities,
        open_value=open_value,
        active_contacts=active_contacts,
        won_opportunities=won_opportunities,
        lost_opportunities=lost_opportunities,
        pipelines=pipelines,
        stages=stages
    )


@router.get("/today", response_model=DashboardTodayResponse)
def get_dashboard_today(db: Session = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)
    start_of_today = datetime.combine(now_utc.date(), time.min, tzinfo=timezone.utc)
    end_of_today = datetime.combine(now_utc.date(), time.max, tzinfo=timezone.utc)

    # Priority mapping for CASE statement sorting
    priority_order = case(
        (Task.priority == TaskPriority.urgent, 1),
        (Task.priority == TaskPriority.high, 2),
        (Task.priority == TaskPriority.medium, 3),
        (Task.priority == TaskPriority.low, 4),
        else_=5
    )

    # 1. Overdue tasks: pending and due_date < start_of_today
    overdue_tasks = (
        db.query(Task)
        .outerjoin(Task.contact)
        .outerjoin(Task.opportunity)
        .options(
            joinedload(Task.contact),
            joinedload(Task.opportunity)
        )
        .filter(
            Task.status == TaskStatus.pending,
            Task.due_date < start_of_today
        )
        .order_by(priority_order, Task.due_date.asc())
        .limit(20)
        .all()
    )

    # 2. Today's tasks: pending and due_date between start_of_today and end_of_today
    today_tasks = (
        db.query(Task)
        .outerjoin(Task.contact)
        .outerjoin(Task.opportunity)
        .options(
            joinedload(Task.contact),
            joinedload(Task.opportunity)
        )
        .filter(
            Task.status == TaskStatus.pending,
            Task.due_date >= start_of_today,
            Task.due_date <= end_of_today
        )
        .order_by(priority_order, Task.due_date.asc())
        .limit(20)
        .all()
    )

    overdue_list = [
        DashboardTaskItem(
            id=t.id,
            title=t.title,
            task_type=t.task_type.value if hasattr(t.task_type, "value") else t.task_type,
            priority=t.priority.value if hasattr(t.priority, "value") else t.priority,
            due_date=t.due_date,
            status=t.status.value if hasattr(t.status, "value") else t.status,
            is_overdue=is_task_overdue(t.due_date, now_utc),
            contact_id=t.contact_id,
            contact_name=t.contact.name if t.contact else None,
            opportunity_id=t.opportunity_id,
            opportunity_title=t.opportunity.title if t.opportunity else None
        )
        for t in overdue_tasks
    ]

    today_list = [
        DashboardTaskItem(
            id=t.id,
            title=t.title,
            task_type=t.task_type.value if hasattr(t.task_type, "value") else t.task_type,
            priority=t.priority.value if hasattr(t.priority, "value") else t.priority,
            due_date=t.due_date,
            status=t.status.value if hasattr(t.status, "value") else t.status,
            is_overdue=is_task_overdue(t.due_date, now_utc),
            contact_id=t.contact_id,
            contact_name=t.contact.name if t.contact else None,
            opportunity_id=t.opportunity_id,
            opportunity_title=t.opportunity.title if t.opportunity else None
        )
        for t in today_tasks
    ]

    return DashboardTodayResponse(
        overdue=overdue_list,
        today=today_list
    )


@router.get("/activity", response_model=List[DashboardActivityItem])
def get_dashboard_activity(db: Session = Depends(get_db)):
    # 25 most recent activities with a left join to include deleted opportunities
    activities = (
        db.query(OpportunityActivity, Opportunity.title.label("opportunity_title"))
        .outerjoin(Opportunity, OpportunityActivity.opportunity_id == Opportunity.id)
        .order_by(OpportunityActivity.created_at.desc())
        .limit(25)
        .all()
    )

    result = []
    for act, opp_title in activities:
        result.append(
            DashboardActivityItem(
                id=act.id,
                opportunity_id=act.opportunity_id,
                opportunity_title=opp_title,
                action_type=act.action_type.value if hasattr(act.action_type, "value") else act.action_type,
                description=act.description,
                created_at=act.created_at
            )
        )

    return result
