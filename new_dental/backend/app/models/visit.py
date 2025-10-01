from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    visit_date = Column(DateTime, nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    service_name = Column(String(255), nullable=True)  # Название услуги на момент приема
    service_price = Column(Numeric(10, 2), nullable=True)  # Цена услуги на момент приема
    diagnosis = Column(Text, nullable=True)  # Диагноз
    treatment_notes = Column(Text, nullable=True)  # Заметки о лечении
    status = Column(String(50), default="completed")  # completed, cancelled, no_show
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="visits")
    doctor = relationship("User", foreign_keys=[doctor_id])
    appointment = relationship("Appointment", back_populates="visits")
    service = relationship("Service", foreign_keys=[service_id])

    def __repr__(self):
        return f"<Visit(id={self.id}, patient_id={self.patient_id}, doctor_id={self.doctor_id}, visit_date={self.visit_date})>"
