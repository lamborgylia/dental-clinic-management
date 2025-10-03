from fastapi import APIRouter, HTTPException
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

router = APIRouter()

@router.post("/create-tables-only")
async def create_tables_only():
    """Создает только таблицы без данных"""
    
    try:
        # Получаем DATABASE_URL из переменных окружения
        database_url = os.getenv('DATABASE_URL')
        
        if not database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL не найден")
        
        # Подключение с разными режимами SSL
        conn = None
        connection_methods = [
            lambda: psycopg2.connect(database_url, sslmode='require'),
            lambda: psycopg2.connect(database_url, sslmode='prefer'),
            lambda: psycopg2.connect(database_url, sslmode='disable'),
            lambda: psycopg2.connect(database_url, connect_timeout=10),
            lambda: psycopg2.connect(database_url)
        ]
        
        for i, method in enumerate(connection_methods):
            try:
                conn = method()
                print(f"Подключение успешно методом {i+1}")
                break
            except Exception as e:
                print(f"Метод {i+1} не сработал: {e}")
                continue
        
        if not conn:
            raise Exception("Не удалось подключиться к базе данных ни одним способом")
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Создание только основных таблиц
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
        created_tables = []
        for i, sql in enumerate(tables_sql, 1):
            try:
                cursor.execute(sql)
                created_tables.append(f"Таблица {i}")
            except Exception as e:
                print(f"Ошибка таблицы {i}: {e}")
        
        cursor.close()
        conn.close()
        
        return {
            "message": "Таблицы успешно созданы!",
            "created_tables": created_tables,
            "next_step": "Теперь можно заполнить данными через другие эндпоинты"
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"Ошибка создания таблиц: {error_msg}")
        
        if "SSL connection has been closed unexpectedly" in error_msg:
            error_msg = "Проблема с SSL подключением к базе данных. Попробуйте позже."
        elif "connection to server" in error_msg:
            error_msg = "Не удается подключиться к базе данных."
        elif "DATABASE_URL не найден" in error_msg:
            error_msg = "Переменная окружения DATABASE_URL не настроена."
        
        raise HTTPException(status_code=500, detail=f"Ошибка создания таблиц: {error_msg}")