from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=False, unique=True, index=True)
    iin = Column(String(12), nullable=False, unique=True, index=True)
    birth_date = Column(Date, nullable=False)
    allergies = Column(Text, nullable=True)
    chronic_diseases = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
    special_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    appointments = relationship("Appointment", back_populates="patient")
    treatment_plans = relationship("TreatmentPlan", back_populates="patient")
    treatment_orders = relationship("TreatmentOrder", back_populates="patient")
    visits = relationship("Visit", back_populates="patient")
    clinic_patients = relationship("ClinicPatient", back_populates="patient")

    def __repr__(self):
        return f"<Patient(id={self.id}, full_name='{self.full_name}', phone='{self.phone}')>"