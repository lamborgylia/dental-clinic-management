#!/usr/bin/env python3
"""
Скрипт для создания таблиц в базе данных на Render
Запускается автоматически при деплое
"""

import os
import sys
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

def create_tables():
    """Создает все таблицы в базе данных"""
    
    # Получаем DATABASE_URL из переменных окружения
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL не найден в переменных окружения")
        return False
    
    try:
        # Создаем подключение к базе данных с SSL настройками для Render
        # Пробуем несколько раз с задержкой
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"🔗 Попытка подключения {attempt + 1}/{max_retries}...")
                engine = create_engine(
                    database_url,
                    connect_args={
                        "sslmode": "require",
                        "sslcert": None,
                        "sslkey": None,
                        "sslrootcert": None
                    },
                    pool_pre_ping=True,
                    pool_recycle=300
                )
                
                # Тестируем подключение
                with engine.connect() as test_conn:
                    test_conn.execute(text("SELECT 1"))
                print("✅ Подключение к базе данных успешно!")
                break
                
            except SQLAlchemyError as e:
                print(f"⚠️ Попытка {attempt + 1} неудачна: {e}")
                if attempt < max_retries - 1:
                    print("⏳ Ждем 5 секунд перед следующей попыткой...")
                    time.sleep(5)
                else:
                    raise e
        
        # Создаем все таблицы
        with engine.connect() as conn:
            # Включаем автокоммит
            conn.execute(text("COMMIT"))
            
            print("📋 Создание таблиц...")
            
            # Создаем таблицы в правильном порядке (с учетом зависимостей)
            tables_sql = [
                # Таблица ролей
                """
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """,
                
                # Таблица клиник
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
                
                # Таблица пользователей
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
                
                # Таблица пациентов
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
                
                # Таблица услуг
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
                
                # Таблица записей на прием
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
                
                # Таблица планов лечения
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
                
                # Таблица услуг в планах лечения
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
                
                # Таблица нарядов
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
                
                # Таблица услуг в нарядах
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
                
                # Таблица связи клиник и пациентов
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
            
            # Выполняем создание таблиц
            for i, sql in enumerate(tables_sql, 1):
                try:
                    conn.execute(text(sql))
                    print(f"✅ Таблица {i} создана")
                except SQLAlchemyError as e:
                    print(f"⚠️ Ошибка при создании таблицы {i}: {e}")
            
            # Создаем индексы для улучшения производительности
            indexes_sql = [
                "CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);",
                "CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);",
                "CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);",
                "CREATE INDEX IF NOT EXISTS idx_patients_iin ON patients(iin);",
                "CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);",
                "CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);",
                "CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);",
                "CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);",
                "CREATE INDEX IF NOT EXISTS idx_treatment_orders_patient_id ON treatment_orders(patient_id);",
                "CREATE INDEX IF NOT EXISTS idx_clinic_patients_clinic_id ON clinic_patients(clinic_id);",
                "CREATE INDEX IF NOT EXISTS idx_clinic_patients_patient_id ON clinic_patients(patient_id);"
            ]
            
            print("🔍 Создание индексов...")
            for sql in indexes_sql:
                try:
                    conn.execute(text(sql))
                except SQLAlchemyError as e:
                    print(f"⚠️ Ошибка при создании индекса: {e}")
            
            print("✅ Все таблицы и индексы созданы успешно!")
            return True
            
    except SQLAlchemyError as e:
        print(f"❌ Ошибка подключения к базе данных: {e}")
        return False
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Создание таблиц базы данных...")
    success = create_tables()
    if success:
        print("🎉 База данных готова к работе!")
        sys.exit(0)
    else:
        print("💥 Ошибка при создании базы данных!")
        sys.exit(1)
