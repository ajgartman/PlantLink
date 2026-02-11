from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project linking a contractor to a plant"""
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        plant_id=project_data.plant_id,
        contractor_id=project_data.contractor_id,
        start_date=project_data.start_date,
        end_date=project_data.end_date
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    projects = db.query(Project).all()
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get a specific project by ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, project_data: ProjectUpdate, db: Session = Depends(get_db)):
    """Update a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update only provided fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.start_date is not None:
        project.start_date = project_data.start_date
    if project_data.end_date is not None:
        project.end_date = project_data.end_date

    db.commit()
    db.refresh(project)

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    return None