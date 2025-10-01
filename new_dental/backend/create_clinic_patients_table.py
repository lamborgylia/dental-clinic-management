#!/usr/bin/env python3
"""
Скрипт для создания таблицы clinic_patients в базе данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from app.models.clinic_patient import ClinicPatient
from app.models import Base
from sqlalchemy import text

def create_clinic_patients_table():
    """Создать таблицу clinic_patients"""
    print("🔄 Создаем таблицу clinic_patients...")
    
    try:
        # Создаем таблицу
        Base.metadata.create_all(bind=engine, tables=[ClinicPatient.__table__])
        print("✅ Таблица clinic_patients успешно создана!")
        
        # Проверяем, что таблица создалась
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'clinic_patients'
            """))
            
            if result.fetchone():
                print("✅ Таблица clinic_patients найдена в базе данных")
            else:
                print("❌ Таблица clinic_patients не найдена в базе данных")
                
    except Exception as e:
        print(f"❌ Ошибка при создании таблицы clinic_patients: {e}")
        return False
    
    return True

def check_table_structure():
    """Проверить структуру созданной таблицы"""
    print("\n🔍 Проверяем структуру таблицы clinic_patients...")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'clinic_patients' 
                ORDER BY ordinal_position
            """))
            
            columns = result.fetchall()
            if columns:
                print("📋 Структура таблицы clinic_patients:")
                print("-" * 80)
                print(f"{'Колонка':<20} {'Тип':<20} {'Nullable':<10} {'Default'}")
                print("-" * 80)
                for col in columns:
                    print(f"{col[0]:<20} {col[1]:<20} {col[2]:<10} {col[3] or 'None'}")
            else:
                print("❌ Не удалось получить информацию о структуре таблицы")
                
    except Exception as e:
        print(f"❌ Ошибка при проверке структуры таблицы: {e}")

if __name__ == "__main__":
    print("🚀 Создание таблицы clinic_patients для системы управления стоматологической клиникой")
    print("=" * 80)
    
    if create_clinic_patients_table():
        check_table_structure()
        print("\n✅ Готово! Таблица clinic_patients создана и готова к использованию.")
    else:
        print("\n❌ Не удалось создать таблицу clinic_patients.")
        sys.exit(1)
