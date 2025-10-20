from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class TreatmentPlanServiceBase(BaseModel):
    service_id: int
    quantity: int = 1
    notes: Optional[str] = None


class TreatmentPlanServiceCreate(TreatmentPlanServiceBase):
    tooth_id: Optional[int] = None
    service_name: Optional[str] = None
    service_price: Optional[float] = None


class TreatmentPlanServiceResponse(TreatmentPlanServiceBase):
    id: int
    tooth_id: Optional[int] = None
    service_name: Optional[str] = None
    service_price: Optional[float] = None

    class Config:
        from_attributes = True


class TreatmentPlanBase(BaseModel):
    patient_id: int
    doctor_id: int
    diagnosis: Optional[str] = None
    notes: Optional[str] = None


class TreatmentPlanCreate(TreatmentPlanBase):
    services: List[TreatmentPlanServiceCreate]
    teeth_services: Optional[Dict[int, List[int]]] = None  # {tooth_id: [service_ids]}


class TreatmentPlanUpdate(BaseModel):
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    services: Optional[List[TreatmentPlanServiceCreate]] = None
    # Данные пациента
    patient_allergies: Optional[str] = None
    patient_chronic_diseases: Optional[str] = None
    patient_contraindications: Optional[str] = None
    patient_special_notes: Optional[str] = None
    # Дополнительные поля для совместимости с frontend
    treatment_description: Optional[str] = None
    treated_teeth: Optional[List[int]] = None
    status: Optional[str] = None


class TreatmentPlanResponse(TreatmentPlanBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    services: List[TreatmentPlanServiceResponse]
    teeth_services: Optional[Dict[int, List[int]]] = None  # {tooth_id: [service_ids]}
    # Данные пациента
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_iin: Optional[str] = None
    patient_birth_date: Optional[str] = None
    patient_allergies: Optional[str] = None
    patient_chronic_diseases: Optional[str] = None
    patient_contraindications: Optional[str] = None
    patient_special_notes: Optional[str] = None
    # Дополнительные поля для совместимости с frontend
    treatment_description: Optional[str] = None
    total_cost: Optional[float] = None
    selected_teeth: Optional[List[int]] = None
    treated_teeth: Optional[List[int]] = None
    status: Optional[str] = "active"

    class Config:
        from_attributes = True
