from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.auth import get_current_user, require_role
from ..models.user import User, UserRole
from ..models.clinic import Clinic
from ..schemas.clinic import ClinicCreate, ClinicUpdate, ClinicResponse

router = APIRouter()

@router.get("/", response_model=List[ClinicResponse])
async def get_clinics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список всех клиник (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    clinics = db.query(Clinic).all()
    return clinics

@router.get("/current", response_model=ClinicResponse)
async def get_current_clinic(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о клинике текущего пользователя"""
    if not current_user.clinic_id:
        raise HTTPException(status_code=404, detail="Пользователь не привязан к клинике")
    
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Клиника не найдена")
    
    return clinic

@router.post("/", response_model=ClinicResponse)
async def create_clinic(
    clinic: ClinicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую клинику (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    db_clinic = Clinic(**clinic.dict())
    db.add(db_clinic)
    db.commit()
    db.refresh(db_clinic)
    return db_clinic

@router.get("/{clinic_id}", response_model=ClinicResponse)
async def get_clinic(
    clinic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о клинике"""
    require_role(current_user, [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.REGISTRAR])
    
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Клиника не найдена")
    
    return clinic

@router.put("/{clinic_id}", response_model=ClinicResponse)
async def update_clinic(
    clinic_id: int,
    clinic: ClinicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить информацию о клинике (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    db_clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not db_clinic:
        raise HTTPException(status_code=404, detail="Клиника не найдена")
    
    for field, value in clinic.dict(exclude_unset=True).items():
        setattr(db_clinic, field, value)
    
    db.commit()
    db.refresh(db_clinic)
    return db_clinic

@router.delete("/{clinic_id}")
async def delete_clinic(
    clinic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить клинику (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Клиника не найдена")
    
    db.delete(clinic)
    db.commit()
    return {"message": "Клиника удалена"}
