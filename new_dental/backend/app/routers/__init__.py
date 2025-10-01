from .auth import router as auth_router
from .clinics import router as clinics_router
from .users import router as users_router
from .patients import router as patients_router
from .services import router as services_router
from .appointments import router as appointments_router

__all__ = [
    "auth_router",
    "clinics_router",
    "users_router",
    "patients_router",
    "services_router",
    "appointments_router"
]
