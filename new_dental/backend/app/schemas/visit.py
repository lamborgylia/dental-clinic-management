from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal


class VisitBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    visit_date: datetime
    service_id: Optional[int] = None
    service_name: Optional[str] = None
    service_price: Optional[Decimal] = None
    diagnosis: Optional[str] = None
    treatment_notes: Optional[str] = None
    status: str = "completed"


class VisitCreate(VisitBase):
    pass


class VisitUpdate(BaseModel):
    service_id: Optional[int] = None
    service_name: Optional[str] = None
    service_price: Optional[Decimal] = None
    diagnosis: Optional[str] = None
    treatment_notes: Optional[str] = None
    status: Optional[str] = None


class VisitResponse(VisitBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Дополнительные поля для удобства
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    appointment_datetime: Optional[datetime] = None

    class Config:
        from_attributes = True


class VisitListResponse(BaseModel):
    visits: list[VisitResponse]
    total: int
    page: int
    size: int
    pages: int
