#!/usr/bin/env python3
"""
Скрипт для пересоздания таблицы пациентов с новыми полями
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.patient import Patient
from sqlalchemy import text

def recreate_patients_table():
    """Пересоздает таблицу пациентов"""
    try:
        # Удаляем старую таблицу если она существует
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS patients CASCADE"))
            conn.commit()
            print("🗑️ Старая таблица 'patients' удалена")
        
        # Создаем новую таблицу
        Patient.metadata.create_all(bind=engine)
        print("✅ Новая таблица 'patients' создана")
        
        # Проверяем структуру таблицы
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'patients' 
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()
            print("\n📋 Структура таблицы 'patients':")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
            
            # Проверяем количество записей
            result = conn.execute(text("SELECT COUNT(*) FROM patients"))
            count = result.scalar()
            print(f"\n📊 Таблица 'patients' содержит {count} записей")
            
    except Exception as e:
        print(f"❌ Ошибка при пересоздании таблицы 'patients': {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Пересоздание таблицы пациентов...")
    success = recreate_patients_table()
    if success:
        print("🎉 Готово!")
    else:
        print("💥 Произошла ошибка!")
        sys.exit(1)
