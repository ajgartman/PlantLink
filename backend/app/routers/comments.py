from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from typing import List

from app.database import get_db
from app.security import get_current_user
from app.models.comment import Comment
from app.models.issue import Issue
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse
from app.email import send_email

router = APIRouter(tags=["comments"])


@router.get(
    "/issues/{issue_id}/comments",
    response_model=List[CommentResponse],
)
def get_comments(
    issue_id: UUID,
    db: Session = Depends(get_db),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments


@router.post(
    "/issues/{issue_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    issue_id: UUID,
    comment_data: CommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if not comment_data.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    new_comment = Comment(
        issue_id=issue_id,
        user_id=current_user.id,
        content=comment_data.content.strip(),
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # Reload the user relationship so it's included in the response
    new_comment.user

    # Notify issue creator about new comment (unless they wrote it)
    if str(issue.created_by_id) != str(current_user.id):
        creator = db.query(User).filter(User.id == issue.created_by_id).first()
        if creator:
            background_tasks.add_task(
                send_email,
                to=creator.email,
                subject=f"New comment on: {issue.title}",
                html=f"<p>Hi {creator.full_name},</p>"
                     f"<p><strong>{current_user.full_name}</strong> commented on your issue "
                     f"<strong>{issue.title}</strong>:</p>"
                     f"<blockquote>{comment_data.content.strip()[:200]}</blockquote>"
                     f"<p>— PlantSync</p>",
            )

    return new_comment