from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.treatment_order import TreatmentOrder, TreatmentOrderService
from app.models.treatment_plan import TreatmentPlan, TreatmentPlanService
from app.models.patient import Patient
from app.models.user import User
from app.models.appointment import Appointment
from app.schemas.treatment_order import (
    TreatmentOrderCreate, 
    TreatmentOrderResponse, 
    TreatmentOrderServiceCreate,
    TreatmentOrderServiceResponse
)
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TreatmentOrderResponse])
async def get_treatment_orders(
    skip: int = 0,
    limit: int = 100,
    clinic_id: Optional[int] = Query(None, description="ID клиники для фильтрации"),
    search: Optional[str] = Query(None, description="Поиск по имени пациента, телефону или ИИН"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список нарядов клиники"""
    # Получаем наряды для клиники
    query = db.query(TreatmentOrder)
    
    # Фильтрация по клинике
    if clinic_id:
        query = query.filter(TreatmentOrder.clinic_id == clinic_id)
    else:
        # Если не указана клиника, используем клинику текущего пользователя
        query = query.filter(TreatmentOrder.clinic_id == current_user.clinic_id)
    
    # Поиск по данным пациента
    if search:
        query = query.join(Patient, TreatmentOrder.patient_id == Patient.id)
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Patient.full_name.ilike(search_term)) |
            (Patient.phone.ilike(search_term)) |
            (Patient.iin.ilike(search_term))
        )
    
    treatment_orders = query.order_by(desc(TreatmentOrder.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for order in treatment_orders:
        # Загружаем данные пациента
        patient = db.query(Patient).filter(Patient.id == order.patient_id).first()
        
        # Загружаем данные врача
        doctor = db.query(User).filter(User.id == order.created_by_id).first()
        
        # Загружаем услуги наряда
        order_services = db.query(TreatmentOrderService).filter(
            TreatmentOrderService.treatment_order_id == order.id
        ).all()
        
        services = []
        for service in order_services:
            services.append(TreatmentOrderServiceResponse(
                id=service.id,
                service_id=service.service_id,
                service_name=service.service_name,
                service_price=service.service_price,
                quantity=service.quantity,
                tooth_number=service.tooth_number,
                notes=service.notes,
                is_completed=service.is_completed
            ))
        
        result.append(TreatmentOrderResponse(
            id=order.id,
            patient_id=order.patient_id,
            patient_name=patient.full_name if patient else "Неизвестно",
            patient_phone=patient.phone if patient else "",
            patient_iin=patient.iin if patient else "",
            doctor_id=order.created_by_id,
            doctor_name=doctor.full_name if doctor else "Неизвестно",
            appointment_id=order.appointment_id,
            visit_date=order.visit_date,
            services=services,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at
        ))
    
    return result

@router.post("/", response_model=TreatmentOrderResponse)
async def create_treatment_order(
    treatment_order: TreatmentOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый наряд"""
    
    # Проверяем, что пациент существует
    patient = db.query(Patient).filter(Patient.id == treatment_order.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пациент не найден"
        )
    
    # Проверяем, что врач существует
    doctor = db.query(User).filter(User.id == treatment_order.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Врач не найден"
        )
    
    # Создаем наряд
    db_treatment_order = TreatmentOrder(
        patient_id=treatment_order.patient_id,
        created_by_id=treatment_order.doctor_id,
        appointment_id=treatment_order.appointment_id,
        visit_date=treatment_order.visit_date,
        total_amount=treatment_order.total_amount,
        status=treatment_order.status,
        clinic_id=current_user.clinic_id
    )
    
    db.add(db_treatment_order)
    db.flush()  # Получаем ID наряда
    
    # Создаем услуги наряда
    for service_data in treatment_order.services:
        db_service = TreatmentOrderService(
            treatment_order_id=db_treatment_order.id,
            service_id=service_data.service_id,
            service_name=service_data.service_name,
            service_price=service_data.service_price,
            quantity=service_data.quantity,
            tooth_number=service_data.tooth_number,
            notes=None,  # Добавляем поле notes
            is_completed=service_data.is_completed
        )
        db.add(db_service)
    
    db.commit()
    db.refresh(db_treatment_order)
    
    # Сохраняем услуги из наряда в план лечения
    await save_services_to_treatment_plan(db, treatment_order.patient_id, treatment_order.services, current_user.clinic_id)
    
    # Возвращаем созданный наряд с полными данными
    order_services = db.query(TreatmentOrderService).filter(
        TreatmentOrderService.treatment_order_id == db_treatment_order.id
    ).all()
    
    services = []
    for service in order_services:
            services.append(TreatmentOrderServiceResponse(
                id=service.id,
                service_id=service.service_id,
                service_name=service.service_name,
                service_price=service.service_price,
                quantity=service.quantity,
                tooth_number=service.tooth_number,
                notes=service.notes,
                is_completed=service.is_completed
            ))
    
    return TreatmentOrderResponse(
        id=db_treatment_order.id,
        patient_id=db_treatment_order.patient_id,
        patient_name=patient.full_name,
        patient_phone=patient.phone,
        patient_iin=patient.iin,
        doctor_id=db_treatment_order.created_by_id,
        doctor_name=doctor.full_name,
        appointment_id=db_treatment_order.appointment_id,
        visit_date=db_treatment_order.visit_date,
        services=services,
        total_amount=db_treatment_order.total_amount,
        status=db_treatment_order.status,
        created_at=db_treatment_order.created_at
    )

@router.get("/{treatment_order_id}", response_model=TreatmentOrderResponse)
async def get_treatment_order(
    treatment_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить наряд по ID"""
    
    treatment_order = db.query(TreatmentOrder).filter(
        TreatmentOrder.id == treatment_order_id,
        TreatmentOrder.clinic_id == current_user.clinic_id
    ).first()
    
    if not treatment_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Наряд не найден"
        )
    
    # Загружаем данные пациента
    patient = db.query(Patient).filter(Patient.id == treatment_order.patient_id).first()
    
    # Загружаем данные врача
    doctor = db.query(User).filter(User.id == treatment_order.created_by_id).first()
    
    # Загружаем услуги наряда
    order_services = db.query(TreatmentOrderService).filter(
        TreatmentOrderService.treatment_order_id == treatment_order.id
    ).all()
    
    services = []
    for service in order_services:
            services.append(TreatmentOrderServiceResponse(
                id=service.id,
                service_id=service.service_id,
                service_name=service.service_name,
                service_price=service.service_price,
                quantity=service.quantity,
                tooth_number=service.tooth_number,
                notes=service.notes,
                is_completed=service.is_completed
            ))
    
    return TreatmentOrderResponse(
        id=treatment_order.id,
        patient_id=treatment_order.patient_id,
        patient_name=patient.full_name if patient else "Неизвестно",
        patient_phone=patient.phone if patient else "",
        patient_iin=patient.iin if patient else "",
        doctor_id=treatment_order.created_by_id,
        doctor_name=doctor.full_name if doctor else "Неизвестно",
        appointment_id=treatment_order.appointment_id,
        visit_date=treatment_order.visit_date,
        services=services,
        total_amount=treatment_order.total_amount,
        status=treatment_order.status,
        created_at=treatment_order.created_at
    )

@router.put("/{treatment_order_id}", response_model=TreatmentOrderResponse)
async def update_treatment_order(
    treatment_order_id: int,
    treatment_order: TreatmentOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить наряд"""
    
    db_treatment_order = db.query(TreatmentOrder).filter(
        TreatmentOrder.id == treatment_order_id,
        TreatmentOrder.clinic_id == current_user.clinic_id
    ).first()
    
    if not db_treatment_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Наряд не найден"
        )
    
    # Обновляем основные поля наряда
    db_treatment_order.patient_id = treatment_order.patient_id
    db_treatment_order.created_by_id = treatment_order.doctor_id
    db_treatment_order.appointment_id = treatment_order.appointment_id
    db_treatment_order.visit_date = treatment_order.visit_date
    db_treatment_order.total_amount = treatment_order.total_amount
    db_treatment_order.status = treatment_order.status
    
    # Удаляем старые услуги
    db.query(TreatmentOrderService).filter(
        TreatmentOrderService.treatment_order_id == treatment_order_id
    ).delete()
    
    # Добавляем новые услуги
    for service_data in treatment_order.services:
        db_service = TreatmentOrderService(
            treatment_order_id=treatment_order_id,
            service_id=service_data.service_id,
            service_name=service_data.service_name,
            service_price=service_data.service_price,
            quantity=service_data.quantity,
            tooth_number=service_data.tooth_number,
            is_completed=service_data.is_completed
        )
        db.add(db_service)
    
    db.commit()
    db.refresh(db_treatment_order)
    
    # Возвращаем обновленный наряд
    return await get_treatment_order(treatment_order_id, db, current_user)

@router.delete("/{treatment_order_id}")
async def delete_treatment_order(
    treatment_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить наряд"""
    
    treatment_order = db.query(TreatmentOrder).filter(
        TreatmentOrder.id == treatment_order_id,
        TreatmentOrder.clinic_id == current_user.clinic_id
    ).first()
    
    if not treatment_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Наряд не найден"
        )
    
    # Удаляем услуги наряда
    db.query(TreatmentOrderService).filter(
        TreatmentOrderService.treatment_order_id == treatment_order_id
    ).delete()
    
    # Удаляем наряд
    db.delete(treatment_order)
    db.commit()
    
    return {"message": "Наряд успешно удален"}


async def save_services_to_treatment_plan(db: Session, patient_id: int, services: List[TreatmentOrderServiceCreate], clinic_id: int):
    """Сохранить услуги из наряда в план лечения"""
    
    # Находим или создаем план лечения для пациента
    treatment_plan = db.query(TreatmentPlan).filter(
        TreatmentPlan.patient_id == patient_id,
        TreatmentPlan.clinic_id == clinic_id
    ).first()
    
    if not treatment_plan:
        # Создаем новый план лечения
        treatment_plan = TreatmentPlan(
            patient_id=patient_id,
            clinic_id=clinic_id,
            doctor_id=None,  # Будет установлен позже
            status="active",
            total_cost=0.0
        )
        db.add(treatment_plan)
        db.flush()
    
    # Добавляем услуги в план лечения
    for service_data in services:
        if service_data.tooth_number > 0:  # Только услуги с указанным зубом
            # Проверяем, не существует ли уже такая услуга для этого зуба
            existing_service = db.query(TreatmentPlanService).filter(
                TreatmentPlanService.treatment_plan_id == treatment_plan.id,
                TreatmentPlanService.tooth_id == service_data.tooth_number,
                TreatmentPlanService.service_id == service_data.service_id
            ).first()
            
            if not existing_service:
                # Создаем новую услугу в плане лечения
                plan_service = TreatmentPlanService(
                    treatment_plan_id=treatment_plan.id,
                    service_id=service_data.service_id,
                    service_name=service_data.service_name,
                    service_price=service_data.service_price,
                    tooth_id=service_data.tooth_number,
                    quantity=service_data.quantity,
                    is_completed=0  # По умолчанию не выполнена
                )
                db.add(plan_service)
    
    db.commit()
    print(f"✅ Сохранено {len([s for s in services if s.tooth_number > 0])} услуг в план лечения для пациента {patient_id}")