from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClinicPatientBase(BaseModel):
    clinic_id: int
    patient_id: int
    first_visit_date: datetime
    last_visit_date: Optional[datetime] = None
    is_active: bool = True


class ClinicPatientCreate(ClinicPatientBase):
    pass


class ClinicPatientUpdate(BaseModel):
    last_visit_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class ClinicPatientResponse(ClinicPatientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Дополнительные поля для удобства
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_iin: Optional[str] = None
    clinic_name: Optional[str] = None

    class Config:
        from_attributes = True
