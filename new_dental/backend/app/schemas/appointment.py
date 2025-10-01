from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.appointment import AppointmentStatus


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    registrar_id: int
    appointment_datetime: datetime
    service_type: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    doctor_id: Optional[int] = None
    appointment_datetime: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True


class AppointmentResponse(AppointmentBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Данные пациента
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_iin: Optional[str] = None
    patient_birth_date: Optional[str] = None
    patient_allergies: Optional[str] = None
    patient_chronic_diseases: Optional[str] = None
    patient_contraindications: Optional[str] = None
    patient_special_notes: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
