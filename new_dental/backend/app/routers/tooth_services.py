from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.tooth_service import ToothService
from ..schemas.tooth_service import ToothServiceCreate, ToothServiceResponse

router = APIRouter(prefix="/tooth-services", tags=["tooth-services"])


@router.post("/", response_model=ToothServiceResponse)
def create_tooth_service(
    tooth_service: ToothServiceCreate,
    db: Session = Depends(get_db)
):
    """Создать новую запись о зубе и услугах"""
    db_tooth_service = ToothService(
        treatment_plan_id=tooth_service.treatment_plan_id,
        tooth_id=tooth_service.tooth_id,
        service_ids=tooth_service.service_ids
    )
    db.add(db_tooth_service)
    db.commit()
    db.refresh(db_tooth_service)
    return db_tooth_service


@router.get("/treatment-plan/{treatment_plan_id}", response_model=List[ToothServiceResponse])
def get_tooth_services_by_treatment_plan(
    treatment_plan_id: int,
    db: Session = Depends(get_db)
):
    """Получить все записи о зубах и услугах для плана лечения"""
    tooth_services = db.query(ToothService).filter(
        ToothService.treatment_plan_id == treatment_plan_id
    ).all()
    return tooth_services


@router.put("/{tooth_service_id}", response_model=ToothServiceResponse)
def update_tooth_service(
    tooth_service_id: int,
    tooth_service: ToothServiceCreate,
    db: Session = Depends(get_db)
):
    """Обновить запись о зубе и услугах"""
    db_tooth_service = db.query(ToothService).filter(
        ToothService.id == tooth_service_id
    ).first()
    
    if not db_tooth_service:
        raise HTTPException(status_code=404, detail="Запись о зубе и услугах не найдена")
    
    db_tooth_service.tooth_id = tooth_service.tooth_id
    db_tooth_service.service_ids = tooth_service.service_ids
    
    db.commit()
    db.refresh(db_tooth_service)
    return db_tooth_service


@router.delete("/{tooth_service_id}")
def delete_tooth_service(
    tooth_service_id: int,
    db: Session = Depends(get_db)
):
    """Удалить запись о зубе и услугах"""
    db_tooth_service = db.query(ToothService).filter(
        ToothService.id == tooth_service_id
    ).first()
    
    if not db_tooth_service:
        raise HTTPException(status_code=404, detail="Запись о зубе и услугах не найдена")
    
    db.delete(db_tooth_service)
    db.commit()
    return {"message": "Запись о зубе и услугах удалена"}


@router.delete("/treatment-plan/{treatment_plan_id}")
def delete_tooth_services_by_treatment_plan(
    treatment_plan_id: int,
    db: Session = Depends(get_db)
):
    """Удалить все записи о зубах и услугах для плана лечения"""
    db.query(ToothService).filter(
        ToothService.treatment_plan_id == treatment_plan_id
    ).delete()
    db.commit()
    return {"message": "Все записи о зубах и услугах для плана лечения удалены"}
