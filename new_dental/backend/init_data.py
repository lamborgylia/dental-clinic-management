#!/usr/bin/env python3
"""
Скрипт для инициализации базовых данных в базе данных на Render
Запускается после создания таблиц
"""

import os
import sys
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from passlib.context import CryptContext

def init_data():
    """Инициализирует базовые данные"""
    
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
                        "sslmode": "disable"
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
        
        # Создаем контекст для хеширования паролей
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        with engine.connect() as conn:
            # Включаем автокоммит
            conn.execute(text("COMMIT"))
            
            print("📋 Инициализация базовых данных...")
            
            # Проверяем, есть ли уже данные
            result = conn.execute(text("SELECT COUNT(*) FROM clinics")).scalar()
            if result > 0:
                print("✅ Данные уже инициализированы")
                return True
            
            # Создаем базовые роли
            roles_sql = [
                "INSERT INTO roles (name, description) VALUES ('admin', 'Администратор системы') ON CONFLICT (name) DO NOTHING;",
                "INSERT INTO roles (name, description) VALUES ('doctor', 'Врач') ON CONFLICT (name) DO NOTHING;",
                "INSERT INTO roles (name, description) VALUES ('nurse', 'Медсестра') ON CONFLICT (name) DO NOTHING;",
                "INSERT INTO roles (name, description) VALUES ('registrar', 'Регистратор') ON CONFLICT (name) DO NOTHING;"
            ]
            
            for sql in roles_sql:
                conn.execute(text(sql))
            
            print("✅ Роли созданы")
            
            # Создаем тестовую клинику
            clinic_sql = """
            INSERT INTO clinics (name, description, address, contacts) 
            VALUES ('Улыбка', 'Стоматологическая клиника', 'ул. Абая 150', '+7 (727) 123-45-67')
            ON CONFLICT DO NOTHING;
            """
            conn.execute(text(clinic_sql))
            
            print("✅ Тестовая клиника создана")
            
            # Получаем ID клиники
            clinic_id = conn.execute(text("SELECT id FROM clinics WHERE name = 'Улыбка'")).scalar()
            
            # Создаем администратора
            admin_password = pwd_context.hash("admin123")
            admin_sql = f"""
            INSERT INTO users (full_name, phone, password_hash, role, clinic_id) 
            VALUES ('Администратор', '+77770000000', '{admin_password}', 'admin', {clinic_id})
            ON CONFLICT (phone) DO NOTHING;
            """
            conn.execute(text(admin_sql))
            
            print("✅ Администратор создан (телефон: +77770000000, пароль: admin123)")
            
            # Создаем тестовые услуги
            services_sql = [
                "INSERT INTO services (name, price, description) VALUES ('Консультация', 5000.00, 'Первичная консультация стоматолога') ON CONFLICT DO NOTHING;",
                "INSERT INTO services (name, price, description) VALUES ('Лечение кариеса', 15000.00, 'Лечение кариеса с пломбированием') ON CONFLICT DO NOTHING;",
                "INSERT INTO services (name, price, description) VALUES ('Удаление зуба', 8000.00, 'Простое удаление зуба') ON CONFLICT DO NOTHING;",
                "INSERT INTO services (name, price, description) VALUES ('Протезирование', 50000.00, 'Изготовление и установка коронки') ON CONFLICT DO NOTHING;",
                "INSERT INTO services (name, price, description) VALUES ('Чистка зубов', 12000.00, 'Профессиональная чистка зубов') ON CONFLICT DO NOTHING;",
                "INSERT INTO services (name, price, description) VALUES ('Детская стоматология', 10000.00, 'Лечение зубов у детей') ON CONFLICT DO NOTHING;"
            ]
            
            for sql in services_sql:
                conn.execute(text(sql))
            
            print("✅ Тестовые услуги созданы")
            
            print("🎉 База данных инициализирована успешно!")
            return True
            
    except SQLAlchemyError as e:
        print(f"❌ Ошибка подключения к базе данных: {e}")
        return False
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Инициализация базовых данных...")
    success = init_data()
    if success:
        print("🎉 База данных готова к работе!")
        sys.exit(0)
    else:
        print("💥 Ошибка при инициализации базы данных!")
        sys.exit(1)
