#!/usr/bin/env python3
"""
Скрипт для добавления полей tooth_id, service_name, service_price в таблицу treatment_plan_services
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from sqlalchemy import text

def add_treatment_plan_service_fields():
    """Добавление полей в таблицу treatment_plan_services"""
    print("🔄 Добавление полей в таблицу treatment_plan_services...")
    
    db = SessionLocal()
    try:
        # Проверяем, существуют ли уже поля
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'treatment_plan_services' 
            AND column_name IN ('tooth_id', 'service_name', 'service_price')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        if 'tooth_id' not in existing_columns:
            print("➕ Добавление поля tooth_id...")
            db.execute(text("ALTER TABLE treatment_plan_services ADD COLUMN tooth_id INTEGER NOT NULL DEFAULT 0"))
        
        if 'service_name' not in existing_columns:
            print("➕ Добавление поля service_name...")
            db.execute(text("ALTER TABLE treatment_plan_services ADD COLUMN service_name VARCHAR(255) NOT NULL DEFAULT ''"))
        
        if 'service_price' not in existing_columns:
            print("➕ Добавление поля service_price...")
            db.execute(text("ALTER TABLE treatment_plan_services ADD COLUMN service_price NUMERIC(10,2) NOT NULL DEFAULT 0"))
        
        db.commit()
        print("✅ Поля успешно добавлены в таблицу treatment_plan_services")
        
    except Exception as e:
        print(f"❌ Ошибка при добавлении полей: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Запуск добавления полей в таблицу treatment_plan_services...")
    add_treatment_plan_service_fields()
    print("✅ Добавление полей завершено!")

