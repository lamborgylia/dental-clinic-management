from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
from .role import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.REGISTRAR)
    is_active = Column(Boolean, default=True)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clinic = relationship("Clinic", back_populates="users")
    appointments_as_doctor = relationship("Appointment", foreign_keys="Appointment.doctor_id", back_populates="doctor")
    appointments_as_registrar = relationship("Appointment", foreign_keys="Appointment.registrar_id", back_populates="registrar")
    treatment_plans = relationship("TreatmentPlan", back_populates="doctor")
    created_treatment_orders = relationship("TreatmentOrder", back_populates="creator")
