from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.dependencies import require_admin
from ..models.user import User
from ..models.service import Service
from ..schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter()


@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Service)
    if active_only:
        query = query.filter(Service.is_active == True)
    
    services = query.offset(skip).limit(limit).all()
    return services


@router.post("/", response_model=ServiceResponse)
async def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_service = Service(**service.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if db_service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for field, value in service.dict(exclude_unset=True).items():
        setattr(db_service, field, value)
    
    db.commit()
    db.refresh(db_service)
    return db_service


@router.delete("/{service_id}")
async def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service.is_active = False
    db.commit()
    return {"message": "Service deactivated"}
