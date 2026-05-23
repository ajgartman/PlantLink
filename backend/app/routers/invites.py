import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.invite import Invite
from app.models.user import User
from app.models.company import Company
from app.schemas.invite import InviteCreate, InviteResponse, InviteInfo, InviteRegister
from app.schemas.user import UserResponse
from app.security import get_current_user, hash_password
from app.dependencies import require_role

router = APIRouter(prefix="/invites", tags=["Invites"])


@router.post("/", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
def create_invite(
    invite_data: InviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    """Create an invite link. Admin/manager only."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="You must belong to a company to invite users")

    # Check if email already has an active invite for this company
    existing = (
        db.query(Invite)
        .filter(
            Invite.email == invite_data.email,
            Invite.company_id == current_user.company_id,
            Invite.used == False,
            Invite.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="An active invite already exists for this email")

    # Check if user already registered
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    invite = Invite(
        email=invite_data.email,
        company_id=current_user.company_id,
        role=invite_data.role,
        token=secrets.token_urlsafe(32),
        expires_at=datetime.utcnow() + timedelta(days=7),
        invited_by_id=current_user.id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


@router.get("/", response_model=List[InviteResponse])
def list_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    """List all invites for the current user's company."""
    return (
        db.query(Invite)
        .filter(Invite.company_id == current_user.company_id)
        .order_by(Invite.created_at.desc())
        .all()
    )


@router.get("/{token}", response_model=InviteInfo)
def validate_invite(token: str, db: Session = Depends(get_db)):
    """Public endpoint — validate an invite token and return company info."""
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    if invite.used:
        raise HTTPException(status_code=400, detail="This invite has already been used")
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invite has expired")

    company = db.query(Company).filter(Company.id == invite.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return InviteInfo(
        email=invite.email,
        role=invite.role,
        company_name=company.name,
        company_type=company.company_type,
        expires_at=invite.expires_at,
    )


@router.post("/accept", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def accept_invite(
    data: InviteRegister,
    db: Session = Depends(get_db),
):
    """Register using an invite token. Links user to the company with the specified role."""
    invite = db.query(Invite).filter(Invite.token == data.token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    if invite.used:
        raise HTTPException(status_code=400, detail="This invite has already been used")
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invite has expired")

    # Check if email already registered
    existing = db.query(User).filter(User.email == invite.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    company = db.query(Company).filter(Company.id == invite.company_id).first()

    new_user = User(
        email=invite.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        company_id=invite.company_id,
        company_name=company.name if company else None,
        role=invite.role,
    )
    db.add(new_user)

    # Mark invite as used
    invite.used = True

    db.commit()
    db.refresh(new_user)
    return new_user
