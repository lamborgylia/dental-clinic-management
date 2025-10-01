from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class ClinicPatient(Base):
    __tablename__ = "clinic_patients"

    id = Column(Integer, primary_key=True, index=True)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    first_visit_date = Column(DateTime, nullable=False, default=func.now())
    last_visit_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)  # Активен ли пациент в этой клинике
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    clinic = relationship("Clinic", back_populates="clinic_patients")
    patient = relationship("Patient", back_populates="clinic_patients")

    def __repr__(self):
        return f"<ClinicPatient(id={self.id}, clinic_id={self.clinic_id}, patient_id={self.patient_id})>"
