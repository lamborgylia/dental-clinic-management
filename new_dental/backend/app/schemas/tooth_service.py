from pydantic import BaseModel
from typing import List


class ToothServiceBase(BaseModel):
    tooth_id: int
    service_ids: List[int]


class ToothServiceCreate(ToothServiceBase):
    treatment_plan_id: int


class ToothServiceResponse(ToothServiceBase):
    id: int
    treatment_plan_id: int

    class Config:
        from_attributes = True
