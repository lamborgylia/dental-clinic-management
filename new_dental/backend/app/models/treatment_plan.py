from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, String, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    diagnosis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    treated_teeth = Column(JSON, nullable=True)  # Массив ID вылеченных зубов
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="treatment_plans")
    doctor = relationship("User", back_populates="treatment_plans")
    services = relationship("TreatmentPlanService", back_populates="treatment_plan", cascade="all, delete-orphan")
    tooth_services = relationship("ToothService", back_populates="treatment_plan")


class TreatmentPlanService(Base):
    __tablename__ = "treatment_plan_services"

    id = Column(Integer, primary_key=True, index=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    tooth_id = Column(Integer, nullable=False)  # Добавлено поле tooth_id
    service_name = Column(String(255), nullable=False)  # Добавлено поле service_name
    service_price = Column(Numeric(10, 2), nullable=False)  # Добавлено поле service_price
    quantity = Column(Integer, default=1)
    is_completed = Column(Integer, default=0)  # Добавлено поле is_completed
    notes = Column(Text, nullable=True)

    # Relationships
    treatment_plan = relationship("TreatmentPlan", back_populates="services")
    service = relationship("Service", back_populates="treatment_plan_services")
