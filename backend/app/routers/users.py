from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.schemas.user import UserResponse
from app.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
def get_users(
    company_id: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User).filter(User.is_active == True)
    # Data isolation: only show users from own company + linked companies
    if current_user.company_id and not company_id:
        linked_company_ids = (
            db.query(Project.plant_id)
            .filter(
                or_(
                    Project.plant_id == current_user.company_id,
                    Project.contractor_id == current_user.company_id,
                )
            )
            .union(
                db.query(Project.contractor_id).filter(
                    or_(
                        Project.plant_id == current_user.company_id,
                        Project.contractor_id == current_user.company_id,
                    )
                )
            )
        )
        query = query.filter(
            or_(
                User.company_id == current_user.company_id,
                User.company_id.in_(linked_company_ids),
            )
        )
    if company_id:
        query = query.filter(User.company_id == company_id)
    if role:
        query = query.filter(User.role == role)
    return query.all()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user