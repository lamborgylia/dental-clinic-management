from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Полное имя пациента")
    phone: str = Field(..., min_length=10, max_length=20, description="Номер телефона")
    iin: str = Field(..., min_length=12, max_length=12, description="ИИН (12 цифр)")
    birth_date: date = Field(..., description="Дата рождения")
    allergies: Optional[str] = Field(None, description="Аллергии")
    chronic_diseases: Optional[str] = Field(None, description="Хронические заболевания")
    contraindications: Optional[str] = Field(None, description="Противопоказания")
    special_notes: Optional[str] = Field(None, description="Особые примечания")


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    iin: Optional[str] = Field(None, min_length=12, max_length=12)
    birth_date: Optional[date] = None
    allergies: Optional[str] = None
    chronic_diseases: Optional[str] = None
    contraindications: Optional[str] = None
    special_notes: Optional[str] = None


class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PatientSearch(BaseModel):
    query: str = Field(..., min_length=1, description="Поисковый запрос (ИИН, телефон или имя)")


class PatientListResponse(BaseModel):
    patients: list[PatientResponse]
    total: int
    page: int
    size: int