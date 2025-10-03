#!/usr/bin/env python3
"""
Скрипт для создания таблиц без psycopg2
"""

import os
import sys
from sqlalchemy import create_engine, text

def create_tables_no_psycopg2():
    """Создает таблицы без использования psycopg2 напрямую"""
    
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL не найден")
        return False
    
    try:
        print("🔗 Подключение к базе данных...")
        print(f"📡 DATABASE_URL: {database_url[:50]}...")
        
        # Подключение с дополнительными параметрами для стабильности
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False,
            connect_args={
                "connect_timeout": 60,
                "application_name": "dental_clinic"
            }
        )
        
        with engine.connect() as conn:
            print("📋 Создание таблиц...")
            
            # Создаем основные таблицы
            tables = [
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
            
            for i, sql in enumerate(tables, 1):
                try:
                    conn.execute(text(sql))
                    print(f"✅ Таблица {i} создана")
                except Exception as e:
                    print(f"⚠️ Ошибка таблицы {i}: {e}")
            
            print("✅ Все таблицы созданы!")
            return True
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print(f"❌ Тип ошибки: {type(e).__name__}")
        return False

if __name__ == "__main__":
    print("🚀 Создание таблиц без psycopg2...")
    success = create_tables_no_psycopg2()
    if success:
        print("🎉 Готово!")
        sys.exit(0)
    else:
        print("💥 Ошибка!")
        sys.exit(1)
