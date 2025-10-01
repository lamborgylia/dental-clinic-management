from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.dependencies import require_registrar_or_above
from ..models.user import User
from ..models.appointment import Appointment
from ..schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter()


@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    skip: int = 0,
    limit: int = 100,
    patient_id: int = None,
    doctor_id: int = None,
    status: str = None,
    current_week_only: bool = False,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_registrar_or_above)
):
    from ..models.patient import Patient
    
    query = db.query(Appointment).join(Patient, Appointment.patient_id == Patient.id)
    
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status:
        query = query.filter(Appointment.status == status)
    
    # Фильтр по текущей неделе
    if current_week_only:
        from datetime import datetime, timedelta
        today = datetime.now().replace(year=2025)  # Используем 2025 год
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        query = query.filter(
            Appointment.appointment_datetime >= start_of_week,
            Appointment.appointment_datetime <= end_of_week
        )
    
    # Фильтр по диапазону дат
    if start_date:
        from datetime import datetime
        start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.filter(Appointment.appointment_datetime >= start_datetime)
    
    if end_date:
        from datetime import datetime
        end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Appointment.appointment_datetime <= end_datetime)
    
    appointments = query.offset(skip).limit(limit).all()
    
    # Преобразуем в формат с данными пациента
    result = []
    for appointment in appointments:
        patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
        appointment_dict = {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "registrar_id": appointment.registrar_id,
            "appointment_datetime": appointment.appointment_datetime,
            "status": appointment.status,
            "service_type": appointment.service_type,
            "notes": appointment.notes,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
            "patient_name": patient.full_name if patient else None,
            "patient_phone": patient.phone if patient else None,
            "patient_iin": patient.iin if patient else None,
            "patient_birth_date": patient.birth_date.isoformat() if patient and patient.birth_date else None,
            "patient_allergies": patient.allergies if patient else None,
            "patient_chronic_diseases": patient.chronic_diseases if patient else None,
            "patient_contraindications": patient.contraindications if patient else None,
            "patient_special_notes": patient.special_notes if patient else None,
        }
        result.append(appointment_dict)
    
    return result


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_registrar_or_above)
):
    db_appointment = Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_registrar_or_above)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appointment: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_registrar_or_above)
):
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    for field, value in appointment.dict(exclude_unset=True).items():
        setattr(db_appointment, field, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_registrar_or_above)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled"}
