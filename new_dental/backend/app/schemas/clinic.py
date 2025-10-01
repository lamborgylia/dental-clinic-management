from pydantic import BaseModel
from typing import Optional


class ClinicBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    contacts: str


class ClinicCreate(ClinicBase):
    pass


class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    contacts: Optional[str] = None
    is_active: Optional[bool] = None


class ClinicResponse(ClinicBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
