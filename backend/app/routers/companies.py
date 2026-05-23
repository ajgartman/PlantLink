from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyResponse
from app.security import get_current_user

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company_data: CompanyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new company (plant or contractor)"""
    new_company = Company(
        name=company_data.name,
        company_type=company_data.company_type,
        email=company_data.email,
        phone=company_data.phone,
        address=company_data.address
    )

    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    return new_company


@router.get("/", response_model=List[CompanyResponse])
def get_companies(response: Response, type: Optional[str] = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Company)
    if type:
        query = query.filter(Company.company_type == type)
    total = query.count()
    companies = query.offset(skip).limit(min(limit, 200)).all()
    response.headers["X-Total-Count"] = str(total)
    return companies


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: str, db: Session = Depends(get_db)):
    """Get a specific company by ID"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company