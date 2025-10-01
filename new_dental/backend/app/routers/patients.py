from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.patient import Patient
from ..schemas.patient import (
    PatientCreate, 
    PatientUpdate, 
    PatientResponse, 
    PatientSearch,
    PatientListResponse
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Создать нового пациента"""
    
    # Проверяем, что ИИН уникален
    existing_iin = db.query(Patient).filter(Patient.iin == patient.iin).first()
    if existing_iin:
        raise HTTPException(status_code=400, detail="Пациент с таким ИИН уже существует")
    
    # Проверяем, что телефон уникален
    existing_phone = db.query(Patient).filter(Patient.phone == patient.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Пациент с таким телефоном уже существует")
    
    db_patient = Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    return db_patient


@router.get("/", response_model=PatientListResponse)
def get_patients(
    page: int = Query(1, ge=1, description="Номер страницы"),
    size: int = Query(10, ge=1, le=500, description="Размер страницы"),
    search: Optional[str] = Query(None, description="Поиск по имени, ИИН или телефону"),
    db: Session = Depends(get_db)
):
    """Получить список пациентов с пагинацией и поиском"""
    
    query = db.query(Patient)
    
    # Поиск по имени, ИИН или телефону
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Patient.full_name.ilike(search_term)) |
            (Patient.iin.ilike(search_term)) |
            (Patient.phone.ilike(search_term))
        )
    
    # Подсчет общего количества
    total = query.count()
    
    # Пагинация
    offset = (page - 1) * size
    patients = query.offset(offset).limit(size).all()
    
    return PatientListResponse(
        patients=patients,
        total=total,
        page=page,
        size=size
    )


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Получить пациента по ID"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    
    return patient


@router.get("/iin/{iin}", response_model=PatientResponse)
def get_patient_by_iin(iin: str, db: Session = Depends(get_db)):
    """Получить пациента по ИИН"""
    
    patient = db.query(Patient).filter(Patient.iin == iin).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент с таким ИИН не найден")
    
    return patient


@router.get("/phone/{phone}", response_model=PatientResponse)
def get_patient_by_phone(phone: str, db: Session = Depends(get_db)):
    """Получить пациента по телефону (поддержка форматов с "+" и без, с форматированием)"""
    # Нормализуем вход: оставляем только цифры
    digits = ''.join(ch for ch in phone if ch.isdigit())
    candidates = set()
    if digits:
        # 77... (без +)
        candidates.add(digits if digits.startswith('7') else digits)
        # +7...
        candidates.add('+' + digits if not digits.startswith('+') else digits)
        # +7 (с возможным пробелом позже в БД не нужен, но на всякий случай)
    # Также пробуем исходную строку как есть
    candidates.add(phone)

    patient = (
        db.query(Patient)
        .filter(Patient.phone.in_(list(candidates)))
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент с таким телефоном не найден")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int, 
    patient_update: PatientUpdate, 
    db: Session = Depends(get_db)
):
    """Обновить данные пациента"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    
    # Проверяем уникальность ИИН, если он обновляется
    if patient_update.iin and patient_update.iin != patient.iin:
        existing_iin = db.query(Patient).filter(
            Patient.iin == patient_update.iin,
            Patient.id != patient_id
        ).first()
        if existing_iin:
            raise HTTPException(status_code=400, detail="Пациент с таким ИИН уже существует")
    
    # Проверяем уникальность телефона, если он обновляется
    if patient_update.phone and patient_update.phone != patient.phone:
        existing_phone = db.query(Patient).filter(
            Patient.phone == patient_update.phone,
            Patient.id != patient_id
        ).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Пациент с таким телефоном уже существует")
    
    # Обновляем только переданные поля
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    
    return patient


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Удалить пациента"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    
    db.delete(patient)
    db.commit()
    
    return {"message": "Пациент успешно удален"}


@router.post("/search", response_model=List[PatientResponse])
def search_patients(search: PatientSearch, db: Session = Depends(get_db)):
    """Поиск пациентов по ИИН, телефону или имени"""
    
    query = search.query.strip()
    if not query:
        return []
    
    # Поиск по ИИН (точное совпадение)
    if len(query) == 12 and query.isdigit():
        patient = db.query(Patient).filter(Patient.iin == query).first()
        if patient:
            return [patient]
    
    # Поиск по телефону (частичное совпадение)
    phone_results = db.query(Patient).filter(Patient.phone.ilike(f"%{query}%")).all()
    if phone_results:
        return phone_results
    
    # Поиск по имени (частичное совпадение)
    name_results = db.query(Patient).filter(Patient.full_name.ilike(f"%{query}%")).all()
    return name_results