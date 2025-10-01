#!/usr/bin/env python3
"""
Скрипт для создания таблицы visits в базе данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from app.models.visit import Visit
from app.models import Base
from sqlalchemy import text

def create_visits_table():
    """Создать таблицу visits"""
    print("🔄 Создаем таблицу visits...")
    
    try:
        # Создаем таблицу
        Base.metadata.create_all(bind=engine, tables=[Visit.__table__])
        print("✅ Таблица visits успешно создана!")
        
        # Проверяем, что таблица создалась
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'visits'
            """))
            
            if result.fetchone():
                print("✅ Таблица visits найдена в базе данных")
            else:
                print("❌ Таблица visits не найдена в базе данных")
                
    except Exception as e:
        print(f"❌ Ошибка при создании таблицы visits: {e}")
        return False
    
    return True

def check_table_structure():
    """Проверить структуру созданной таблицы"""
    print("\n🔍 Проверяем структуру таблицы visits...")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'visits' 
                ORDER BY ordinal_position
            """))
            
            columns = result.fetchall()
            if columns:
                print("📋 Структура таблицы visits:")
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
    print("🚀 Создание таблицы visits для системы управления стоматологической клиникой")
    print("=" * 80)
    
    if create_visits_table():
        check_table_structure()
        print("\n✅ Готово! Таблица visits создана и готова к использованию.")
    else:
        print("\n❌ Не удалось создать таблицу visits.")
        sys.exit(1)
