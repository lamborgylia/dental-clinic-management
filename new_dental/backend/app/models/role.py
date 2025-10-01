from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    REGISTRAR = "registrar"
    PATIENT = "patient"
