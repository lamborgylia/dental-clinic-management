from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import List, Optional
from ..core.database import get_db
from ..core.dependencies import get_current_user, require_medical_staff
from ..models.visit import Visit
from ..models.patient import Patient
from ..models.user import User
from ..models.appointment import Appointment
from ..models.service import Service
from ..schemas.visit import VisitCreate, VisitUpdate, VisitResponse, VisitListResponse

router = APIRouter()


@router.get("/", response_model=VisitListResponse)
async def get_visits(
    patient_id: Optional[int] = Query(None, description="Фильтр по ID пациента"),
    doctor_id: Optional[int] = Query(None, description="Фильтр по ID врача"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    size: int = Query(20, ge=1, le=100, description="Размер страницы"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список приемов с пагинацией и фильтрацией"""
    require_medical_staff(current_user)
    
    query = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor),
        joinedload(Visit.appointment),
        joinedload(Visit.service)
    )
    
    # Применяем фильтры
    if patient_id:
        query = query.filter(Visit.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Visit.doctor_id == doctor_id)
    
    # Подсчитываем общее количество
    total = query.count()
    
    # Применяем пагинацию и сортировку
    visits = query.order_by(desc(Visit.visit_date)).offset((page - 1) * size).limit(size).all()
    
    # Формируем ответ с дополнительными полями
    visit_responses = []
    for visit in visits:
        visit_dict = {
            "id": visit.id,
            "patient_id": visit.patient_id,
            "doctor_id": visit.doctor_id,
            "appointment_id": visit.appointment_id,
            "visit_date": visit.visit_date,
            "service_id": visit.service_id,
            "service_name": visit.service_name,
            "service_price": visit.service_price,
            "diagnosis": visit.diagnosis,
            "treatment_notes": visit.treatment_notes,
            "status": visit.status,
            "created_at": visit.created_at,
            "updated_at": visit.updated_at,
            "patient_name": visit.patient.full_name if visit.patient else None,
            "doctor_name": visit.doctor.full_name if visit.doctor else None,
            "appointment_datetime": visit.appointment.appointment_datetime if visit.appointment else None
        }
        visit_responses.append(VisitResponse(**visit_dict))
    
    pages = (total + size - 1) // size
    
    return VisitListResponse(
        visits=visit_responses,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о конкретном приеме"""
    require_medical_staff(current_user)
    
    visit = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor),
        joinedload(Visit.appointment),
        joinedload(Visit.service)
    ).filter(Visit.id == visit_id).first()
    
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Прием не найден"
        )
    
    visit_dict = {
        "id": visit.id,
        "patient_id": visit.patient_id,
        "doctor_id": visit.doctor_id,
        "appointment_id": visit.appointment_id,
        "visit_date": visit.visit_date,
        "service_id": visit.service_id,
        "service_name": visit.service_name,
        "service_price": visit.service_price,
        "diagnosis": visit.diagnosis,
        "treatment_notes": visit.treatment_notes,
        "status": visit.status,
        "created_at": visit.created_at,
        "updated_at": visit.updated_at,
        "patient_name": visit.patient.full_name if visit.patient else None,
        "doctor_name": visit.doctor.full_name if visit.doctor else None,
        "appointment_datetime": visit.appointment.appointment_datetime if visit.appointment else None
    }
    
    return VisitResponse(**visit_dict)


@router.post("/", response_model=VisitResponse)
async def create_visit(
    visit_data: VisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую запись о приеме"""
    require_medical_staff(current_user)
    
    # Проверяем, что пациент существует
    patient = db.query(Patient).filter(Patient.id == visit_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пациент не найден"
        )
    
    # Проверяем, что врач существует
    doctor = db.query(User).filter(User.id == visit_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Врач не найден"
        )
    
    # Если указан appointment_id, проверяем его существование
    if visit_data.appointment_id:
        appointment = db.query(Appointment).filter(Appointment.id == visit_data.appointment_id).first()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Запись на прием не найдена"
            )
    
    # Если указан service_id, получаем актуальную информацию об услуге
    if visit_data.service_id:
        service = db.query(Service).filter(Service.id == visit_data.service_id).first()
        if service:
            visit_data.service_name = service.name
            visit_data.service_price = service.price
    
    # Создаем запись о приеме
    visit = Visit(**visit_data.dict())
    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    # Загружаем связанные данные для ответа
    visit = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor),
        joinedload(Visit.appointment),
        joinedload(Visit.service)
    ).filter(Visit.id == visit.id).first()
    
    visit_dict = {
        "id": visit.id,
        "patient_id": visit.patient_id,
        "doctor_id": visit.doctor_id,
        "appointment_id": visit.appointment_id,
        "visit_date": visit.visit_date,
        "service_id": visit.service_id,
        "service_name": visit.service_name,
        "service_price": visit.service_price,
        "diagnosis": visit.diagnosis,
        "treatment_notes": visit.treatment_notes,
        "status": visit.status,
        "created_at": visit.created_at,
        "updated_at": visit.updated_at,
        "patient_name": visit.patient.full_name if visit.patient else None,
        "doctor_name": visit.doctor.full_name if visit.doctor else None,
        "appointment_datetime": visit.appointment.appointment_datetime if visit.appointment else None
    }
    
    return VisitResponse(**visit_dict)


@router.put("/{visit_id}", response_model=VisitResponse)
async def update_visit(
    visit_id: int,
    visit_data: VisitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить информацию о приеме"""
    require_medical_staff(current_user)
    
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Прием не найден"
        )
    
    # Обновляем только переданные поля
    update_data = visit_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(visit, field, value)
    
    db.commit()
    db.refresh(visit)
    
    # Загружаем связанные данные для ответа
    visit = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor),
        joinedload(Visit.appointment),
        joinedload(Visit.service)
    ).filter(Visit.id == visit.id).first()
    
    visit_dict = {
        "id": visit.id,
        "patient_id": visit.patient_id,
        "doctor_id": visit.doctor_id,
        "appointment_id": visit.appointment_id,
        "visit_date": visit.visit_date,
        "service_id": visit.service_id,
        "service_name": visit.service_name,
        "service_price": visit.service_price,
        "diagnosis": visit.diagnosis,
        "treatment_notes": visit.treatment_notes,
        "status": visit.status,
        "created_at": visit.created_at,
        "updated_at": visit.updated_at,
        "patient_name": visit.patient.full_name if visit.patient else None,
        "doctor_name": visit.doctor.full_name if visit.doctor else None,
        "appointment_datetime": visit.appointment.appointment_datetime if visit.appointment else None
    }
    
    return VisitResponse(**visit_dict)


@router.delete("/{visit_id}")
async def delete_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить запись о приеме"""
    require_medical_staff(current_user)
    
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Прием не найден"
        )
    
    db.delete(visit)
    db.commit()
    
    return {"message": "Запись о приеме удалена"}


@router.get("/patient/{patient_id}", response_model=List[VisitResponse])
async def get_patient_visits(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все приемы конкретного пациента"""
    require_medical_staff(current_user)
    
    visits = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor),
        joinedload(Visit.appointment),
        joinedload(Visit.service)
    ).filter(Visit.patient_id == patient_id).order_by(desc(Visit.visit_date)).all()
    
    visit_responses = []
    for visit in visits:
        visit_dict = {
            "id": visit.id,
            "patient_id": visit.patient_id,
            "doctor_id": visit.doctor_id,
            "appointment_id": visit.appointment_id,
            "visit_date": visit.visit_date,
            "service_id": visit.service_id,
            "service_name": visit.service_name,
            "service_price": visit.service_price,
            "diagnosis": visit.diagnosis,
            "treatment_notes": visit.treatment_notes,
            "status": visit.status,
            "created_at": visit.created_at,
            "updated_at": visit.updated_at,
            "patient_name": visit.patient.full_name if visit.patient else None,
            "doctor_name": visit.doctor.full_name if visit.doctor else None,
            "appointment_datetime": visit.appointment.appointment_datetime if visit.appointment else None
        }
        visit_responses.append(VisitResponse(**visit_dict))
    
    return visit_responses


@router.get("/doctor/{doctor_id}", response_model=List[VisitResponse])
async def get_doctor_visits(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все приемы конкретного врача"""
    require_medical_staff(current_user)
    
    visits = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor),
        joinedload(Visit.appointment),
        joinedload(Visit.service)
    ).filter(Visit.doctor_id == doctor_id).order_by(desc(Visit.visit_date)).all()
    
    visit_responses = []
    for visit in visits:
        visit_dict = {
            "id": visit.id,
            "patient_id": visit.patient_id,
            "doctor_id": visit.doctor_id,
            "appointment_id": visit.appointment_id,
            "visit_date": visit.visit_date,
            "service_id": visit.service_id,
            "service_name": visit.service_name,
            "service_price": visit.service_price,
            "diagnosis": visit.diagnosis,
            "treatment_notes": visit.treatment_notes,
            "status": visit.status,
            "created_at": visit.created_at,
            "updated_at": visit.updated_at,
            "patient_name": visit.patient.full_name if visit.patient else None,
            "doctor_name": visit.doctor.full_name if visit.doctor else None,
            "appointment_datetime": visit.appointment.appointment_datetime if visit.appointment else None
        }
        visit_responses.append(VisitResponse(**visit_dict))
    
    return visit_responses
