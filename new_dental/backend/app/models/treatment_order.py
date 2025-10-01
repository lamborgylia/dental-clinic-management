from sqlalchemy import Column, Integer, Numeric, ForeignKey, DateTime, Text, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class TreatmentOrder(Base):
    __tablename__ = "treatment_orders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Doctor who created the order
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    visit_date = Column(DateTime(timezone=True), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False) # Added clinic_id

    patient = relationship("Patient", back_populates="treatment_orders")
    creator = relationship("User", back_populates="created_treatment_orders")
    appointment = relationship("Appointment", back_populates="treatment_order")
    services = relationship("TreatmentOrderService", back_populates="treatment_order", cascade="all, delete-orphan")
    clinic = relationship("Clinic", back_populates="treatment_orders") # Added clinic relationship


class TreatmentOrderService(Base):
    __tablename__ = "treatment_order_services"

    id = Column(Integer, primary_key=True, index=True)
    treatment_order_id = Column(Integer, ForeignKey("treatment_orders.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    service_name = Column(String(255), nullable=False) # Added service_name
    service_price = Column(Numeric(10, 2), nullable=False) # Added service_price
    quantity = Column(Integer, default=1)
    tooth_number = Column(Integer, nullable=False) # Added tooth_number
    notes = Column(Text, nullable=True)
    is_completed = Column(Integer, default=0) # Added is_completed

    treatment_order = relationship("TreatmentOrder", back_populates="services")
    service = relationship("Service")
