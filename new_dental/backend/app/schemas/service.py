from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ServiceBase(BaseModel):
    name: str
    price: Decimal
    description: Optional[str] = None
    clinic_id: int


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceResponse(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
