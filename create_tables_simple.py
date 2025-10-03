#!/usr/bin/env python3
"""
Простой скрипт для создания таблиц в PostgreSQL
"""

import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_tables():
    """Создает таблицы в базе данных"""
    
    # Получаем DATABASE_URL из переменных окружения
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL не найден в переменных окружения")
        return False
    
    print("🔗 Подключение к базе данных...")
    print(f"📡 URL: {database_url[:20]}...")
    
    try:
        # Подключение с SSL
        conn = psycopg2.connect(
            database_url,
            sslmode='require'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Подключение установлено!")
        
        # Создаем таблицы
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
        
        print("📋 Создание таблиц...")
        
        for i, sql in enumerate(tables_sql, 1):
            try:
                cursor.execute(sql)
                print(f"✅ Таблица {i} создана")
            except Exception as e:
                print(f"⚠️ Ошибка таблицы {i}: {e}")
        
        # Создаем индексы для производительности
        indexes_sql = [
            "CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);",
            "CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);",
            "CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_treatment_orders_patient ON treatment_orders(patient_id);",
            "CREATE INDEX IF NOT EXISTS idx_clinic_patients_clinic ON clinic_patients(clinic_id);",
            "CREATE INDEX IF NOT EXISTS idx_clinic_patients_patient ON clinic_patients(patient_id);"
        ]
        
        print("🔍 Создание индексов...")
        for i, sql in enumerate(indexes_sql, 1):
            try:
                cursor.execute(sql)
                print(f"✅ Индекс {i} создан")
            except Exception as e:
                print(f"⚠️ Ошибка индекса {i}: {e}")
        
        cursor.close()
        conn.close()
        
        print("🎉 Все таблицы и индексы созданы успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Создание таблиц в базе данных...")
    success = create_tables()
    if success:
        print("✅ Готово!")
    else:
        print("💥 Ошибка!")
