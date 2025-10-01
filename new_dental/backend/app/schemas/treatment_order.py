from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TreatmentOrderServiceCreate(BaseModel):
    service_id: int
    service_name: str
    service_price: float
    quantity: int
    tooth_number: int
    notes: Optional[str] = None
    is_completed: int = 0

class TreatmentOrderServiceResponse(BaseModel):
    id: int
    service_id: int
    service_name: str
    service_price: float
    quantity: int
    tooth_number: int
    notes: Optional[str] = None
    is_completed: int

    class Config:
        from_attributes = True

class TreatmentOrderCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    visit_date: datetime
    services: List[TreatmentOrderServiceCreate]
    total_amount: float
    status: str = "completed"

class TreatmentOrderResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    patient_phone: str
    patient_iin: str
    doctor_id: int
    doctor_name: str
    appointment_id: Optional[int]
    visit_date: datetime
    services: List[TreatmentOrderServiceResponse]
    total_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True