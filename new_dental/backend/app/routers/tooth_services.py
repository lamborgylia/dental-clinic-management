from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.tooth_service import ToothService
from ..schemas.tooth_service import ToothServiceCreate, ToothServiceResponse, ToothServiceUpdate

router = APIRouter(prefix="/tooth-services", tags=["tooth-services"])


@router.post("/", response_model=ToothServiceResponse)
def create_tooth_service(
    tooth_service: ToothServiceCreate,
    db: Session = Depends(get_db)
):
    """Создать новую запись о зубе и услугах"""
    # Инициализируем статусы услуг как "pending" по умолчанию
    service_statuses = {}
    for service_id in tooth_service.service_ids:
        service_statuses[service_id] = "pending"
    
    db_tooth_service = ToothService(
        treatment_plan_id=tooth_service.treatment_plan_id,
        tooth_id=tooth_service.tooth_id,
        service_ids=tooth_service.service_ids,
        service_statuses=service_statuses
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
    tooth_service: ToothServiceUpdate,
    db: Session = Depends(get_db)
):
    """Обновить запись о зубе и услугах"""
    db_tooth_service = db.query(ToothService).filter(
        ToothService.id == tooth_service_id
    ).first()
    
    if not db_tooth_service:
        raise HTTPException(status_code=404, detail="Запись о зубе и услугах не найдена")
    
    if tooth_service.service_ids is not None:
        db_tooth_service.service_ids = tooth_service.service_ids
        # Обновляем статусы для новых услуг
        if tooth_service.service_statuses is None:
            service_statuses = {}
            for service_id in tooth_service.service_ids:
                # Сохраняем существующий статус или устанавливаем "pending"
                service_statuses[service_id] = db_tooth_service.service_statuses.get(service_id, "pending")
            db_tooth_service.service_statuses = service_statuses
    
    if tooth_service.service_statuses is not None:
        db_tooth_service.service_statuses = tooth_service.service_statuses
    
    db.commit()
    db.refresh(db_tooth_service)
    return db_tooth_service


@router.patch("/{tooth_service_id}/service/{service_id}/status")
def update_service_status(
    tooth_service_id: int,
    service_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Обновить статус конкретной услуги на зубе"""
    if status not in ["pending", "completed"]:
        raise HTTPException(status_code=400, detail="Статус должен быть 'pending' или 'completed'")
    
    db_tooth_service = db.query(ToothService).filter(
        ToothService.id == tooth_service_id
    ).first()
    
    if not db_tooth_service:
        raise HTTPException(status_code=404, detail="Запись о зубе и услугах не найдена")
    
    if service_id not in db_tooth_service.service_ids:
        raise HTTPException(status_code=400, detail="Услуга не назначена на этот зуб")
    
    # Обновляем статус услуги
    if db_tooth_service.service_statuses is None:
        db_tooth_service.service_statuses = {}
    
    db_tooth_service.service_statuses[service_id] = status
    
    db.commit()
    return {"message": f"Статус услуги {service_id} обновлен на {status}"}


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
