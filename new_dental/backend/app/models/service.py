from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clinic = relationship("Clinic", back_populates="services")
    treatment_plan_services = relationship("TreatmentPlanService", back_populates="service")
    treatment_order_services = relationship("TreatmentOrderService", back_populates="service")
