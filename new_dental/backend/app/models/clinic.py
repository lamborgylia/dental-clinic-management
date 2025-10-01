from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base


class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=False)
    contacts = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    users = relationship("User", back_populates="clinic")
    services = relationship("Service", back_populates="clinic")
    clinic_patients = relationship("ClinicPatient", back_populates="clinic")
    treatment_orders = relationship("TreatmentOrder", back_populates="clinic")
