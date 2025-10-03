#!/usr/bin/env python3
"""
Скрипт для инициализации данных без psycopg2
"""

import os
import sys
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

def init_data_final():
    """Инициализирует данные без использования psycopg2 напрямую"""
    
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
            print("📋 Инициализация данных...")
            
            # Проверяем, есть ли уже данные
            result = conn.execute(text("SELECT COUNT(*) FROM clinics")).scalar()
            if result > 0:
                print("✅ Данные уже есть")
                return True
            
            # Создаем клинику
            clinic_sql = """
            INSERT INTO clinics (name, description, address, contacts) 
            VALUES ('Улыбка', 'Стоматологическая клиника', 'ул. Абая 150', '+7 (727) 123-45-67')
            ON CONFLICT DO NOTHING;
            """
            conn.execute(text(clinic_sql))
            print("✅ Клиника создана")
            
            # Получаем ID клиники
            clinic_id = conn.execute(text("SELECT id FROM clinics WHERE name = 'Улыбка'")).scalar()
            
            # Создаем админа
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            admin_password = pwd_context.hash("admin123")
            
            admin_sql = f"""
            INSERT INTO users (full_name, phone, password_hash, role, clinic_id) 
            VALUES ('Администратор', '+77770000000', '{admin_password}', 'admin', {clinic_id})
            ON CONFLICT (phone) DO NOTHING;
            """
            conn.execute(text(admin_sql))
            print("✅ Админ создан (+77770000000 / admin123)")
            
            # Создаем услуги
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
            
            print("✅ Услуги созданы")
            print("🎉 Данные инициализированы!")
            return True
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print(f"❌ Тип ошибки: {type(e).__name__}")
        return False

if __name__ == "__main__":
    print("🚀 Инициализация данных без psycopg2...")
    success = init_data_final()
    if success:
        print("🎉 Готово!")
        sys.exit(0)
    else:
        print("💥 Ошибка!")
        sys.exit(1)
