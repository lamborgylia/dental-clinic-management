from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth_router, patients_router, appointments_router, services_router, clinics_router, users_router, tooth_services, treatment_plans, treatment_orders, visits, clinic_patients, deploy
from .core.database import engine
from .models import Base

# Создаем таблицы (отключено для деплоя)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dental Clinic Management System API",
    description="API для системы управления стоматологической клиникой",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
        "http://192.168.0.12:5175",
        "http://192.168.0.12:5176",
        "http://192.168.0.12:5177",
        "http://192.168.12.136:5175",
        "http://192.168.12.136:5176",
        "http://192.168.12.136:5177",
        "http://192.168.12.93:5173",
        "http://192.168.12.93:5174",
        "http://192.168.12.93:5175",
        "http://192.168.12.93:5176",
        "http://192.168.12.93:5177",
        "http://10.113.0.166:5175",
        "http://10.113.0.166:5176",
        "http://10.113.0.166:5177",
        # Продакшен адреса
        "https://dental-care-g4oc.onrender.com",
        "http://dental-care-g4oc.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(patients_router)
app.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
app.include_router(services_router, prefix="/services", tags=["services"])
app.include_router(clinics_router, prefix="/clinics", tags=["clinics"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(tooth_services.router)
app.include_router(treatment_plans.router)
app.include_router(treatment_orders.router, prefix="/treatment-orders", tags=["treatment-orders"])
app.include_router(visits.router, prefix="/visits", tags=["visits"])
app.include_router(clinic_patients.router, prefix="/clinic-patients", tags=["clinic-patients"])
app.include_router(deploy.router, prefix="/deploy", tags=["deploy"])

@app.get("/")
async def root():
    return {"message": "Dental Clinic Management System API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/debug-auth")
async def debug_auth():
    """Отладочный эндпоинт для проверки авторизации"""
    try:
        # Простая проверка без bcrypt
        return {
            "message": "Отладка авторизации",
            "status": "ok",
            "timestamp": "2025-10-03T20:30:00Z"
        }
    except Exception as e:
        return {
            "message": "Ошибка отладки авторизации",
            "error": str(e)
        }
