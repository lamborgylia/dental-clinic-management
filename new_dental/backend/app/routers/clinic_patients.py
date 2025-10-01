from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, func
from typing import List, Optional
from ..core.database import get_db
from ..core.dependencies import get_current_user, require_medical_staff
from ..models.clinic_patient import ClinicPatient
from ..models.patient import Patient
from ..models.clinic import Clinic
from ..models.user import User
from ..models.appointment import Appointment
from ..schemas.clinic_patient import ClinicPatientCreate, ClinicPatientUpdate, ClinicPatientResponse

router = APIRouter()


@router.get("/", response_model=List[ClinicPatientResponse])
async def get_clinic_patients(
    page: int = Query(1, ge=1, description="Номер страницы"),
    size: int = Query(20, ge=1, le=100, description="Размер страницы"),
    doctor_id: Optional[int] = Query(None, description="ID врача для фильтрации"),
    search: Optional[str] = Query(None, description="Поисковый запрос (имя, телефон, ИИН)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Получить список пациентов клиники с фильтрацией"""
    require_medical_staff(current_user)
    
    # Базовый запрос
    query = db.query(ClinicPatient).options(
        joinedload(ClinicPatient.patient),
        joinedload(ClinicPatient.clinic)
    ).filter(
        ClinicPatient.clinic_id == current_user.clinic_id,
        ClinicPatient.is_active == True
    )
    
    # Фильтр по врачу (через записи)
    if doctor_id:
        from ..models.appointment import Appointment
        query = query.join(Appointment, Appointment.patient_id == ClinicPatient.patient_id).filter(
            Appointment.doctor_id == doctor_id
        ).distinct()
    
    # Поиск по данным пациента (гибкий поиск без учета регистра)
    if search:
        # Очищаем поисковый запрос от лишних символов
        search_clean = search.strip()
        if search_clean:
            # Используем ilike с русской collation для корректной работы с кириллицей
            from sqlalchemy import text, or_
            search_pattern = f"%{search_clean}%"
            query = query.join(Patient, Patient.id == ClinicPatient.patient_id).filter(
                or_(
                    text("patients.full_name ILIKE :search COLLATE \"ru-RU-x-icu\"").params(search=search_pattern),
                    text("patients.phone ILIKE :search COLLATE \"ru-RU-x-icu\"").params(search=search_pattern),
                    text("patients.iin ILIKE :search COLLATE \"ru-RU-x-icu\"").params(search=search_pattern)
                )
            )
    
    # Получаем пациентов с пагинацией
    clinic_patients = query.order_by(desc(ClinicPatient.last_visit_date)).offset((page - 1) * size).limit(size).all()
    
    # Формируем ответ с дополнительными полями
    result = []
    for cp in clinic_patients:
        cp_dict = {
            "id": cp.id,
            "clinic_id": cp.clinic_id,
            "patient_id": cp.patient_id,
            "first_visit_date": cp.first_visit_date,
            "last_visit_date": cp.last_visit_date,
            "is_active": cp.is_active,
            "created_at": cp.created_at,
            "updated_at": cp.updated_at,
            "patient_name": cp.patient.full_name if cp.patient else None,
            "patient_phone": cp.patient.phone if cp.patient else None,
            "patient_iin": cp.patient.iin if cp.patient else None,
            "clinic_name": cp.clinic.name if cp.clinic else None
        }
        result.append(ClinicPatientResponse(**cp_dict))
    
    return result


@router.get("/doctors-stats")
async def get_doctors_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Получить статистику по врачам клиники"""
    require_medical_staff(current_user)
    
    
    # Получаем врачей клиники с количеством пациентов
    doctors_stats = db.query(
        User.id,
        User.full_name,
        User.role,
        func.count(func.distinct(ClinicPatient.patient_id)).label('patient_count')
    ).join(
        Appointment, Appointment.doctor_id == User.id
    ).join(
        ClinicPatient, ClinicPatient.patient_id == Appointment.patient_id
    ).filter(
        User.clinic_id == current_user.clinic_id,
        User.role.in_(['doctor', 'nurse']),
        User.is_active == True,
        ClinicPatient.is_active == True
    ).group_by(
        User.id, User.full_name, User.role
    ).all()
    
    result = []
    for doctor in doctors_stats:
        result.append({
            "id": doctor.id,
            "full_name": doctor.full_name,
            "role": doctor.role,
            "patient_count": doctor.patient_count
        })
    
    return result


@router.post("/", response_model=ClinicPatientResponse)
async def add_patient_to_clinic(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Добавить пациента в клинику"""
    require_medical_staff(current_user)
    
    # Проверяем, что пациент существует
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пациент не найден"
        )
    
    # Проверяем, что пациент еще не добавлен в эту клинику
    existing = db.query(ClinicPatient).filter(
        and_(
            ClinicPatient.clinic_id == current_user.clinic_id,
            ClinicPatient.patient_id == patient_id
        )
    ).first()
    
    if existing:
        if existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пациент уже добавлен в эту клинику"
            )
        else:
            # Реактивируем пациента
            existing.is_active = True
            existing.last_visit_date = None
            db.commit()
            db.refresh(existing)
            
            # Формируем ответ
            cp_dict = {
                "id": existing.id,
                "clinic_id": existing.clinic_id,
                "patient_id": existing.patient_id,
                "first_visit_date": existing.first_visit_date,
                "last_visit_date": existing.last_visit_date,
                "is_active": existing.is_active,
                "created_at": existing.created_at,
                "updated_at": existing.updated_at,
                "patient_name": patient.full_name,
                "patient_phone": patient.phone,
                "patient_iin": patient.iin,
                "clinic_name": current_user.clinic.name if current_user.clinic else None
            }
            return ClinicPatientResponse(**cp_dict)
    
    # Создаем новую связь
    clinic_patient = ClinicPatient(
        clinic_id=current_user.clinic_id,
        patient_id=patient_id
    )
    db.add(clinic_patient)
    db.commit()
    db.refresh(clinic_patient)
    
    # Формируем ответ
    cp_dict = {
        "id": clinic_patient.id,
        "clinic_id": clinic_patient.clinic_id,
        "patient_id": clinic_patient.patient_id,
        "first_visit_date": clinic_patient.first_visit_date,
        "last_visit_date": clinic_patient.last_visit_date,
        "is_active": clinic_patient.is_active,
        "created_at": clinic_patient.created_at,
        "updated_at": clinic_patient.updated_at,
        "patient_name": patient.full_name,
        "patient_phone": patient.phone,
        "patient_iin": patient.iin,
        "clinic_name": current_user.clinic.name if current_user.clinic else None
    }
    return ClinicPatientResponse(**cp_dict)


@router.put("/{clinic_patient_id}", response_model=ClinicPatientResponse)
async def update_clinic_patient(
    clinic_patient_id: int,
    update_data: ClinicPatientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Обновить информацию о пациенте в клинике"""
    require_medical_staff(current_user)
    
    clinic_patient = db.query(ClinicPatient).filter(
        and_(
            ClinicPatient.id == clinic_patient_id,
            ClinicPatient.clinic_id == current_user.clinic_id
        )
    ).first()
    
    if not clinic_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пациент не найден в этой клинике"
        )
    
    # Обновляем только переданные поля
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(clinic_patient, field, value)
    
    db.commit()
    db.refresh(clinic_patient)
    
    # Загружаем связанные данные
    clinic_patient = db.query(ClinicPatient).options(
        joinedload(ClinicPatient.patient),
        joinedload(ClinicPatient.clinic)
    ).filter(ClinicPatient.id == clinic_patient_id).first()
    
    # Формируем ответ
    cp_dict = {
        "id": clinic_patient.id,
        "clinic_id": clinic_patient.clinic_id,
        "patient_id": clinic_patient.patient_id,
        "first_visit_date": clinic_patient.first_visit_date,
        "last_visit_date": clinic_patient.last_visit_date,
        "is_active": clinic_patient.is_active,
        "created_at": clinic_patient.created_at,
        "updated_at": clinic_patient.updated_at,
        "patient_name": clinic_patient.patient.full_name if clinic_patient.patient else None,
        "patient_phone": clinic_patient.patient.phone if clinic_patient.patient else None,
        "patient_iin": clinic_patient.patient.iin if clinic_patient.patient else None,
        "clinic_name": clinic_patient.clinic.name if clinic_patient.clinic else None
    }
    return ClinicPatientResponse(**cp_dict)


@router.delete("/{clinic_patient_id}")
async def remove_patient_from_clinic(
    clinic_patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Удалить пациента из клиники (деактивировать)"""
    require_medical_staff(current_user)
    
    clinic_patient = db.query(ClinicPatient).filter(
        and_(
            ClinicPatient.id == clinic_patient_id,
            ClinicPatient.clinic_id == current_user.clinic_id
        )
    ).first()
    
    if not clinic_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пациент не найден в этой клинике"
        )
    
    # Деактивируем пациента вместо удаления
    clinic_patient.is_active = False
    db.commit()
    
    return {"message": "Пациент удален из клиники"}


@router.get("/search", response_model=List[dict])
async def search_patients(
    query: str = Query(..., description="Поисковый запрос (имя, телефон, ИИН)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Поиск пациентов по общей базе"""
    require_medical_staff(current_user)
    
    # Поиск по общей таблице пациентов
    patients = db.query(Patient).filter(
        Patient.full_name.ilike(f"%{query}%") |
        Patient.phone.ilike(f"%{query}%") |
        Patient.iin.ilike(f"%{query}%")
    ).limit(20).all()
    
    # Формируем результат с информацией о том, добавлен ли пациент в клинику
    result = []
    for patient in patients:
        # Проверяем, добавлен ли пациент в текущую клинику
        clinic_patient = db.query(ClinicPatient).filter(
            and_(
                ClinicPatient.clinic_id == current_user.clinic_id,
                ClinicPatient.patient_id == patient.id,
                ClinicPatient.is_active == True
            )
        ).first()
        
        result.append({
            "id": patient.id,
            "full_name": patient.full_name,
            "phone": patient.phone,
            "iin": patient.iin,
            "birth_date": patient.birth_date.isoformat() if patient.birth_date else None,
            "allergies": patient.allergies,
            "chronic_diseases": patient.chronic_diseases,
            "contraindications": patient.contraindications,
            "special_notes": patient.special_notes,
            "is_in_clinic": clinic_patient is not None,
            "first_visit_date": clinic_patient.first_visit_date.isoformat() if clinic_patient and clinic_patient.first_visit_date else None
        })
    
    return result
