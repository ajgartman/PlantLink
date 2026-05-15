from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, aliased
from typing import List
from app.database import get_db
from app.models.issue import Issue
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.security import get_current_user
from app.models.user import User



router = APIRouter(prefix="/issues", tags=["Issues"])


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
        issue_data: IssueCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new issue (requires authentication)"""
    new_issue = Issue(
        title=issue_data.title,
        description=issue_data.description,
        priority=issue_data.priority,
        location=issue_data.location,
        project_id=issue_data.project_id,
        created_by_id=current_user.id,  # ← From JWT token!
        assigned_to_id=issue_data.assigned_to_id,
        due_date=issue_data.due_date
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    return new_issue


@router.get("/", response_model=List[IssueResponse])
def get_issues(db: Session = Depends(get_db)):
    """Get all issues"""
    print("ISSUES COUNT:", db.query(Issue).count())
    issues = db.query(Issue).join(User, Issue.created_by).join(aliased(User), Issue.assigned_to).all()
    return issues


@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: str, db: Session = Depends(get_db)):
    """Get a specific issue by ID"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.put("/{issue_id}", response_model=IssueResponse)
def update_issue(issue_id: str, issue_data: IssueUpdate, db: Session = Depends(get_db)):
    """Update an issue"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

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

    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(issue_id: str, db: Session = Depends(get_db)):
    """Delete an issue"""
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    db.delete(issue)
    db.commit()

    return None