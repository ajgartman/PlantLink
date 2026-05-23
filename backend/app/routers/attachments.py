import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.attachment import Attachment
from app.models.issue import Issue
from app.models.user import User
from app.schemas.attachment import AttachmentResponse
from app.security import get_current_user

router = APIRouter(tags=["Attachments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILES_PER_ISSUE = 10


@router.post(
    "/issues/{issue_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_attachment(
    issue_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a file attachment to an issue."""
    # Verify issue exists
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    # Check per-issue file limit
    existing_count = db.query(Attachment).filter(Attachment.issue_id == issue_id).count()
    if existing_count >= MAX_FILES_PER_ISSUE:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES_PER_ISSUE} files per issue")

    # Save to disk with unique name
    ext = os.path.splitext(file.filename or "file")[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Store metadata in DB
    attachment = Attachment(
        issue_id=issue_id,
        filename=file.filename or "untitled",
        url=f"/uploads/{stored_name}",
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        uploaded_by_id=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    # Eager-load the relationship so Pydantic can serialize it
    attachment = (
        db.query(Attachment)
        .options(joinedload(Attachment.uploaded_by))
        .filter(Attachment.id == attachment.id)
        .first()
    )
    return attachment


@router.get(
    "/issues/{issue_id}/attachments",
    response_model=List[AttachmentResponse],
)
def list_attachments(issue_id: str, db: Session = Depends(get_db)):
    """List all attachments for an issue."""
    return (
        db.query(Attachment)
        .filter(Attachment.issue_id == issue_id)
        .options(joinedload(Attachment.uploaded_by))
        .order_by(Attachment.created_at.asc())
        .all()
    )


@router.delete(
    "/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attachment(
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an attachment (uploader or admin only)."""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Only the uploader or an admin can delete
    if str(attachment.uploaded_by_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to delete this attachment")

    # Remove file from disk
    file_path = os.path.join(UPLOAD_DIR, os.path.basename(attachment.url))
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(attachment)
    db.commit()
    return None
