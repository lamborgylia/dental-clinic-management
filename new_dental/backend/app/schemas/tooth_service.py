from pydantic import BaseModel
from typing import List, Dict, Optional


class ToothServiceBase(BaseModel):
    tooth_id: int
    service_ids: List[int]
    service_statuses: Optional[Dict[int, str]] = None  # {service_id: "completed"/"pending"}


class ToothServiceCreate(ToothServiceBase):
    treatment_plan_id: int


class ToothServiceResponse(ToothServiceBase):
    id: int
    treatment_plan_id: int

    class Config:
        from_attributes = True


class ToothServiceUpdate(BaseModel):
    service_ids: Optional[List[int]] = None
    service_statuses: Optional[Dict[int, str]] = None
