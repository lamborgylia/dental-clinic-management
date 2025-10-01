#!/usr/bin/env python3
"""
Скрипт для добавления полей в таблицу treatment_orders и treatment_order_services
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from sqlalchemy import text

def add_treatment_order_fields():
    """Добавление полей в таблицы treatment_orders и treatment_order_services"""
    print("🔄 Добавление полей в таблицы treatment_orders и treatment_order_services...")
    
    db = SessionLocal()
    try:
        # Проверяем, существуют ли уже поля в treatment_orders
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'treatment_orders' 
            AND column_name IN ('appointment_id', 'visit_date', 'status', 'clinic_id')
        """))
        existing_columns = [row[0] for row in result.fetchall()]

        if 'appointment_id' not in existing_columns:
            print("➕ Добавляем столбец 'appointment_id' в treatment_orders...")
            db.execute(text("ALTER TABLE treatment_orders ADD COLUMN appointment_id INTEGER REFERENCES appointments(id)"))
            print("✅ Столбец 'appointment_id' добавлен.")
        else:
            print("ℹ️ Столбец 'appointment_id' уже существует.")

        if 'visit_date' not in existing_columns:
            print("➕ Добавляем столбец 'visit_date' в treatment_orders...")
            db.execute(text("ALTER TABLE treatment_orders ADD COLUMN visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"))
            print("✅ Столбец 'visit_date' добавлен.")
        else:
            print("ℹ️ Столбец 'visit_date' уже существует.")

        if 'status' not in existing_columns:
            print("➕ Добавляем столбец 'status' в treatment_orders...")
            db.execute(text("ALTER TABLE treatment_orders ADD COLUMN status VARCHAR(50) DEFAULT 'completed'"))
            print("✅ Столбец 'status' добавлен.")
        else:
            print("ℹ️ Столбец 'status' уже существует.")

        if 'clinic_id' not in existing_columns:
            print("➕ Добавляем столбец 'clinic_id' в treatment_orders...")
            db.execute(text("ALTER TABLE treatment_orders ADD COLUMN clinic_id INTEGER NOT NULL REFERENCES clinics(id)"))
            print("✅ Столбец 'clinic_id' добавлен.")
        else:
            print("ℹ️ Столбец 'clinic_id' уже существует.")

        # Проверяем, существуют ли уже поля в treatment_order_services
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'treatment_order_services' 
            AND column_name IN ('service_name', 'service_price', 'tooth_number', 'is_completed')
        """))
        existing_columns = [row[0] for row in result.fetchall()]

        if 'service_name' not in existing_columns:
            print("➕ Добавляем столбец 'service_name' в treatment_order_services...")
            db.execute(text("ALTER TABLE treatment_order_services ADD COLUMN service_name VARCHAR(255) NOT NULL DEFAULT ''"))
            print("✅ Столбец 'service_name' добавлен.")
        else:
            print("ℹ️ Столбец 'service_name' уже существует.")

        if 'service_price' not in existing_columns:
            print("➕ Добавляем столбец 'service_price' в treatment_order_services...")
            db.execute(text("ALTER TABLE treatment_order_services ADD COLUMN service_price NUMERIC(10, 2) NOT NULL DEFAULT 0.0"))
            print("✅ Столбец 'service_price' добавлен.")
        else:
            print("ℹ️ Столбец 'service_price' уже существует.")

        if 'tooth_number' not in existing_columns:
            print("➕ Добавляем столбец 'tooth_number' в treatment_order_services...")
            db.execute(text("ALTER TABLE treatment_order_services ADD COLUMN tooth_number INTEGER NOT NULL DEFAULT 0"))
            print("✅ Столбец 'tooth_number' добавлен.")
        else:
            print("ℹ️ Столбец 'tooth_number' уже существует.")

        if 'is_completed' not in existing_columns:
            print("➕ Добавляем столбец 'is_completed' в treatment_order_services...")
            db.execute(text("ALTER TABLE treatment_order_services ADD COLUMN is_completed INTEGER DEFAULT 0"))
            print("✅ Столбец 'is_completed' добавлен.")
        else:
            print("ℹ️ Столбец 'is_completed' уже существует.")
        
        db.commit()
        print("✅ Поля успешно добавлены или уже существуют.")
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при добавлении полей: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_treatment_order_fields()

