from pydantic import BaseModel
from typing import Optional
from ..models.role import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserLogin(BaseModel):
    phone: str
    password: str


class UserCreate(BaseModel):
    full_name: str
    phone: str
    password: str
    role: UserRole
    clinic_id: int
