from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from datetime import datetime, timedelta
import hashlib
import os

router = APIRouter()

def hash_password(password: str) -> str:
    """Хеширует пароль"""
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/deploy-database")
async def deploy_database(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Деплой базы данных - создание таблиц и заполнение данными"""
    
    # Проверяем, что пользователь - администратор
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем DATABASE_URL из переменных окружения
        database_url = os.getenv('DATABASE_URL')
        
        if not database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL не найден")
        
        # Подключение с SSL
        conn = psycopg2.connect(
            database_url,
            sslmode='require'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Создание таблиц
        tables_sql = [
            # Клиники
            """
            CREATE TABLE IF NOT EXISTS clinics (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                address TEXT,
                contacts TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Пользователи
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                clinic_id INTEGER REFERENCES clinics(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Пациенты
            """
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                iin VARCHAR(12) UNIQUE NOT NULL,
                birth_date DATE,
                allergies TEXT,
                chronic_diseases TEXT,
                contraindications TEXT,
                special_notes TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Услуги
            """
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Записи
            """
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                doctor_id INTEGER REFERENCES users(id),
                registrar_id INTEGER REFERENCES users(id),
                appointment_datetime TIMESTAMP NOT NULL,
                service_type VARCHAR(255),
                notes TEXT,
                status VARCHAR(50) DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Планы лечения
            """
            CREATE TABLE IF NOT EXISTS treatment_plans (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                doctor_id INTEGER REFERENCES users(id),
                diagnosis TEXT,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Услуги в планах лечения
            """
            CREATE TABLE IF NOT EXISTS treatment_plan_services (
                id SERIAL PRIMARY KEY,
                treatment_plan_id INTEGER REFERENCES treatment_plans(id),
                service_id INTEGER REFERENCES services(id),
                tooth_id INTEGER,
                quantity INTEGER DEFAULT 1,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Наряды
            """
            CREATE TABLE IF NOT EXISTS treatment_orders (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                doctor_id INTEGER REFERENCES users(id),
                appointment_id INTEGER REFERENCES appointments(id),
                visit_date TIMESTAMP,
                total_amount DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Услуги в нарядах
            """
            CREATE TABLE IF NOT EXISTS treatment_order_services (
                id SERIAL PRIMARY KEY,
                treatment_order_id INTEGER REFERENCES treatment_orders(id),
                service_id INTEGER REFERENCES services(id),
                tooth_number INTEGER,
                quantity INTEGER DEFAULT 1,
                notes TEXT,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            
            # Связь клиник и пациентов
            """
            CREATE TABLE IF NOT EXISTS clinic_patients (
                id SERIAL PRIMARY KEY,
                clinic_id INTEGER REFERENCES clinics(id),
                patient_id INTEGER REFERENCES patients(id),
                first_visit_date TIMESTAMP,
                last_visit_date TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(clinic_id, patient_id)
            );
            """
        ]
        
        # Создаем таблицы
        for i, sql in enumerate(tables_sql, 1):
            try:
                cursor.execute(sql)
            except Exception as e:
                print(f"Ошибка таблицы {i}: {e}")
        
        # Создание индексов
        indexes_sql = [
            "CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);",
            "CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);",
            "CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_treatment_orders_patient ON treatment_orders(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_clinic_patients_clinic ON clinic_patients(clinic_id);",
            "CREATE INDEX IF NOT EXISTS idx_clinic_patients_patient ON clinic_patients(patient_id);"
        ]
        
        for sql in indexes_sql:
            try:
                cursor.execute(sql)
            except Exception as e:
                print(f"Ошибка индекса: {e}")
        
        # Проверяем, есть ли уже данные
        cursor.execute("SELECT COUNT(*) FROM clinics;")
        clinic_count = cursor.fetchone()[0]
        
        if clinic_count > 0:
            # Очищаем таблицы
            tables_to_clear = [
                'treatment_order_services', 'treatment_orders',
                'treatment_plan_services', 'treatment_plans',
                'appointments', 'clinic_patients',
                'patients', 'services', 'users', 'clinics'
            ]
            for table in tables_to_clear:
                cursor.execute(f"DELETE FROM {table};")
        
        # Заполнение данными
        # 1. Клиники
        clinics_data = [
            ("Стоматология 'Белоснежка'", "Современная стоматологическая клиника", "ул. Абая 150", "+7 (727) 123-45-67"),
            ("У Чикатилы", "Семейная стоматология", "пр. Достык 100", "+7 (727) 234-56-78"),
            ("Дентал Плюс", "Стоматологический центр", "ул. Сатпаева 50", "+7 (727) 345-67-89")
        ]
        
        clinic_ids = []
        for name, description, address, contacts in clinics_data:
            cursor.execute("""
                INSERT INTO clinics (name, description, address, contacts) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id;
            """, (name, description, address, contacts))
            clinic_id = cursor.fetchone()[0]
            clinic_ids.append(clinic_id)
        
        # 2. Пользователи
        users_data = [
            ("Администратор", "+77771234567", "admin123", "admin", clinic_ids[0]),
            ("Доктор Иванов", "+77771234568", "doctor123", "doctor", clinic_ids[0]),
            ("Медсестра Петрова", "+77771234569", "nurse123", "nurse", clinic_ids[0]),
            ("Регистратор Сидорова", "+77771234570", "registrar123", "registrar", clinic_ids[0]),
            ("Доктор Смирнов", "+77771234571", "doctor123", "doctor", clinic_ids[1]),
            ("Медсестра Козлова", "+77771234572", "nurse123", "nurse", clinic_ids[1])
        ]
        
        user_ids = []
        for full_name, phone, password, role, clinic_id in users_data:
            password_hash = hash_password(password)
            cursor.execute("""
                INSERT INTO users (full_name, phone, password_hash, role, clinic_id) 
                VALUES (%s, %s, %s, %s, %s) 
                RETURNING id;
            """, (full_name, phone, password_hash, role, clinic_id))
            user_id = cursor.fetchone()[0]
            user_ids.append(user_id)
        
        # 3. Услуги
        services_data = [
            ("Консультация", 5000.00, "Первичная консультация стоматолога"),
            ("Лечение кариеса", 15000.00, "Лечение кариеса с пломбированием"),
            ("Удаление зуба", 8000.00, "Простое удаление зуба"),
            ("Протезирование", 50000.00, "Изготовление и установка коронки"),
            ("Имплантация", 120000.00, "Установка зубного импланта"),
            ("Чистка зубов", 10000.00, "Профессиональная гигиена полости рта"),
            ("Отбеливание", 25000.00, "Отбеливание зубов"),
            ("Ортодонтия", 80000.00, "Исправление прикуса"),
            ("Детская стоматология", 12000.00, "Лечение зубов у детей"),
            ("Эндодонтия", 20000.00, "Лечение корневых каналов")
        ]
        
        service_ids = []
        for name, price, description in services_data:
            cursor.execute("""
                INSERT INTO services (name, price, description) 
                VALUES (%s, %s, %s) 
                RETURNING id;
            """, (name, price, description))
            service_id = cursor.fetchone()[0]
            service_ids.append(service_id)
        
        # 4. Пациенты
        patients_data = [
            ("Айгуль Нурланова", "+77771234580", "123456789012", "1990-05-15"),
            ("Асхат Касымов", "+77771234581", "123456789013", "1985-08-22"),
            ("Мария Петрова", "+77771234582", "123456789014", "1992-12-03"),
            ("Алексей Иванов", "+77771234583", "123456789015", "1988-03-18"),
            ("Айша Толеуова", "+77771234584", "123456789016", "1995-07-25"),
            ("Дмитрий Смирнов", "+77771234585", "123456789017", "1987-11-12"),
            ("Анна Козлова", "+77771234586", "123456789018", "1993-04-08"),
            ("Сергей Волков", "+77771234587", "123456789019", "1989-09-30")
        ]
        
        patient_ids = []
        for full_name, phone, iin, birth_date in patients_data:
            cursor.execute("""
                INSERT INTO patients (full_name, phone, iin, birth_date) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id;
            """, (full_name, phone, iin, birth_date))
            patient_id = cursor.fetchone()[0]
            patient_ids.append(patient_id)
        
        # 5. Связь клиник и пациентов
        for i, patient_id in enumerate(patient_ids):
            if i < 4:
                clinic_id = clinic_ids[0]
            elif i < 6:
                clinic_id = clinic_ids[1]
            else:
                clinic_id = clinic_ids[2]
            
            cursor.execute("""
                INSERT INTO clinic_patients (clinic_id, patient_id, first_visit_date) 
                VALUES (%s, %s, %s);
            """, (clinic_id, patient_id, datetime.now() - timedelta(days=30)))
        
        # 6. Записи на прием
        appointments_data = [
            (patient_ids[0], user_ids[1], user_ids[3], datetime.now() + timedelta(days=1, hours=10), "Консультация", "Плановый осмотр"),
            (patient_ids[1], user_ids[1], user_ids[3], datetime.now() + timedelta(days=2, hours=14), "Лечение кариеса", "Лечение зуба 16"),
            (patient_ids[2], user_ids[4], user_ids[3], datetime.now() + timedelta(days=3, hours=11), "Чистка зубов", "Профессиональная гигиена"),
            (patient_ids[3], user_ids[1], user_ids[3], datetime.now() + timedelta(days=4, hours=15), "Консультация", "Проблемы с деснами"),
            (patient_ids[4], user_ids[4], user_ids[3], datetime.now() + timedelta(days=5, hours=9), "Детская стоматология", "Лечение молочного зуба")
        ]
        
        appointment_ids = []
        for patient_id, doctor_id, registrar_id, datetime_val, service_type, notes in appointments_data:
            cursor.execute("""
                INSERT INTO appointments (patient_id, doctor_id, registrar_id, appointment_datetime, service_type, notes) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING id;
            """, (patient_id, doctor_id, registrar_id, datetime_val, service_type, notes))
            appointment_id = cursor.fetchone()[0]
            appointment_ids.append(appointment_id)
        
        cursor.close()
        conn.close()
        
        return {
            "message": "База данных успешно развернута!",
            "created": {
                "clinics": len(clinic_ids),
                "users": len(user_ids),
                "services": len(service_ids),
                "patients": len(patient_ids),
                "appointments": len(appointment_ids)
            },
            "login_credentials": {
                "admin": "+77771234567 / admin123",
                "doctor": "+77771234568 / doctor123",
                "nurse": "+77771234569 / nurse123",
                "registrar": "+77771234570 / registrar123"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка деплоя: {str(e)}")
