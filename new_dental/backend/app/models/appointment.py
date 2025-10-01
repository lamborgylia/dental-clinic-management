from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, DateTime as SQLDateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class AppointmentStatus(str):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Может быть медсестра
    registrar_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_datetime = Column(DateTime, nullable=False)
    status = Column(String(20), default=AppointmentStatus.SCHEDULED)
    service_type = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(SQLDateTime(timezone=True), server_default=func.now())
    updated_at = Column(SQLDateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="appointments_as_doctor")
    registrar = relationship("User", foreign_keys=[registrar_id], back_populates="appointments_as_registrar")
    visits = relationship("Visit", back_populates="appointment")
    treatment_order = relationship("TreatmentOrder", back_populates="appointment")
