from sqlalchemy import Column, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base


class ToothService(Base):
    __tablename__ = "tooth_services"

    id = Column(Integer, primary_key=True, index=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    tooth_id = Column(Integer, nullable=False)  # ID зуба (например, 11, 12, 21, 22, etc.)
    service_ids = Column(JSON, nullable=False)  # Массив ID услуг для этого зуба
    service_statuses = Column(JSON, nullable=True)  # Статусы услуг: {service_id: "completed"/"pending"}

    # Relationships
    treatment_plan = relationship("TreatmentPlan", back_populates="tooth_services")
