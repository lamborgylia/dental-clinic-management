from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.role import UserRole


class UserBase(BaseModel):
    full_name: str
    phone: str
    role: UserRole
    clinic_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    clinic_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    role: UserRole
    clinic_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
