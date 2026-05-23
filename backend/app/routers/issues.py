from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.issue import Issue
from app.models.issue_history import IssueHistory
from app.models.user import User
from app.models.project import Project
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.schemas.issue_history import IssueHistoryResponse
from app.security import get_current_user
from app.dependencies import require_role
from app.email import send_email



router = APIRouter(prefix="/issues", tags=["Issues"])


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
        issue_data: IssueCreate,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: User = Depends(require_role("admin", "manager", "operator")),
):
    """Create a new issue (requires authentication)"""
    new_issue = Issue(
        title=issue_data.title,
        description=issue_data.description,
        priority=issue_data.priority,
        location=issue_data.location,
        project_id=issue_data.project_id,
        created_by_id=current_user.id,
        assigned_to_id=issue_data.assigned_to_id,
        due_date=issue_data.due_date
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    # Email assignee if issue is assigned on creation
    if new_issue.assigned_to_id:
        assignee = db.query(User).filter(User.id == new_issue.assigned_to_id).first()
        if assignee:
            background_tasks.add_task(
                send_email,
                to=assignee.email,
                subject=f"New issue assigned: {new_issue.title}",
                html=f"<p>Hi {assignee.full_name},</p>"
                     f"<p>You've been assigned to a new issue: <strong>{new_issue.title}</strong></p>"
                     f"<p>Priority: {new_issue.priority}</p>"
                     f"<p>— PlantSync</p>",
            )

    return new_issue


@router.get("/", response_model=List[IssueResponse])
def get_issues(
    response: Response,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project_id: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Issue).join(Project, Issue.project_id == Project.id).options(
        joinedload(Issue.created_by),
        joinedload(Issue.assigned_to),
    )
    # Data isolation: only show issues for projects linked to the user's company
    if current_user.company_id:
        query = query.filter(
            or_(
                Project.plant_id == current_user.company_id,
                Project.contractor_id == current_user.company_id,
            )
        )
    if status:
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    if project_id:
        query = query.filter(Issue.project_id == project_id)
    if q:
        query = query.filter(
            or_(
                Issue.title.ilike(f"%{q}%"),
                Issue.description.ilike(f"%{q}%"),
                Issue.location.ilike(f"%{q}%"),
            )
        )
    total = query.count()
    issues = query.offset(skip).limit(min(limit, 200)).all()
    response.headers["X-Total-Count"] = str(total)
    return issues


@router.get("/history/recent", response_model=List[IssueHistoryResponse])
def get_recent_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent history entries across all issues for the user's company."""
    query = (
        db.query(IssueHistory)
        .join(Issue, IssueHistory.issue_id == Issue.id)
        .join(Project, Issue.project_id == Project.id)
        .options(joinedload(IssueHistory.user))
    )
    if current_user.company_id:
        query = query.filter(
            or_(
                Project.plant_id == current_user.company_id,
                Project.contractor_id == current_user.company_id,
            )
        )
    return query.order_by(IssueHistory.created_at.desc()).limit(min(limit, 50)).all()


@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: str, db: Session = Depends(get_db)):
    """Get a specific issue by ID"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.put("/{issue_id}", response_model=IssueResponse)
def update_issue(
    issue_id: str,
    issue_data: IssueUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_assigned_to_id = str(issue.assigned_to_id) if issue.assigned_to_id else None
    old_status = issue.status

    # Track history for key fields
    for field in ["status", "priority", "assigned_to_id"]:
        new_val = getattr(issue_data, field, None)
        if new_val is not None:
            old_val = getattr(issue, field)
            if str(old_val) != str(new_val):
                history = IssueHistory(
                    issue_id=issue.id,
                    user_id=current_user.id,
                    field_changed=field,
                    old_value=str(old_val) if old_val else None,
                    new_value=str(new_val),
                )
                db.add(history)

    # Update only provided fields
    if issue_data.title is not None:
        issue.title = issue_data.title
    if issue_data.description is not None:
        issue.description = issue_data.description
    if issue_data.status is not None:
        issue.status = issue_data.status
    if issue_data.priority is not None:
        issue.priority = issue_data.priority
    if issue_data.location is not None:
        issue.location = issue_data.location
    if issue_data.assigned_to_id is not None:
        issue.assigned_to_id = issue_data.assigned_to_id
    if issue_data.due_date is not None:
        issue.due_date = issue_data.due_date
    if issue_data.resolved_at is not None:
        issue.resolved_at = issue_data.resolved_at

    db.commit()
    db.refresh(issue)

    # Email notifications (async, won't block the response)
    # 1. Notify new assignee when assignment changes
    if (
        issue_data.assigned_to_id is not None
        and str(issue_data.assigned_to_id) != old_assigned_to_id
    ):
        assignee = db.query(User).filter(User.id == issue_data.assigned_to_id).first()
        if assignee:
            background_tasks.add_task(
                send_email,
                to=assignee.email,
                subject=f"Issue assigned to you: {issue.title}",
                html=f"<p>Hi {assignee.full_name},</p>"
                     f"<p>You've been assigned to issue: <strong>{issue.title}</strong></p>"
                     f"<p>— PlantSync</p>",
            )

    # 2. Notify creator when issue is resolved
    if (
        issue_data.status is not None
        and issue_data.status in ("resolved", "closed")
        and old_status not in ("resolved", "closed")
    ):
        creator = db.query(User).filter(User.id == issue.created_by_id).first()
        if creator and str(creator.id) != str(current_user.id):
            background_tasks.add_task(
                send_email,
                to=creator.email,
                subject=f"Issue resolved: {issue.title}",
                html=f"<p>Hi {creator.full_name},</p>"
                     f"<p>Your issue <strong>{issue.title}</strong> has been marked as {issue_data.status}.</p>"
                     f"<p>— PlantSync</p>",
            )

    return issue


@router.get("/{issue_id}/history", response_model=List[IssueHistoryResponse])
def get_issue_history(issue_id: str, db: Session = Depends(get_db)):
    return (
        db.query(IssueHistory)
        .filter(IssueHistory.issue_id == issue_id)
        .options(joinedload(IssueHistory.user))
        .order_by(IssueHistory.created_at.asc())
        .all()
    )


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(issue_id: str, db: Session = Depends(get_db)):
    """Delete an issue"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    db.delete(issue)
    db.commit()

    return None