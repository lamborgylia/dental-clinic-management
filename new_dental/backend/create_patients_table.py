#!/usr/bin/env python3
"""
Скрипт для создания таблицы пациентов в базе данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.patient import Patient
from sqlalchemy import text

def create_patients_table():
    """Создает таблицу пациентов"""
    try:
        # Создаем таблицу
        Patient.metadata.create_all(bind=engine)
        print("✅ Таблица 'patients' успешно создана")
        
        # Проверяем, что таблица создалась
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM patients"))
            count = result.scalar()
            print(f"📊 Таблица 'patients' содержит {count} записей")
            
    except Exception as e:
        print(f"❌ Ошибка при создании таблицы 'patients': {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Создание таблицы пациентов...")
    success = create_patients_table()
    if success:
        print("🎉 Готово!")
    else:
        print("💥 Произошла ошибка!")
        sys.exit(1)
