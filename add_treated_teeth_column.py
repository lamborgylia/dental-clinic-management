#!/usr/bin/env python3
"""
Скрипт для добавления поля treated_teeth в таблицу treatment_plans
"""

import psycopg2
import os

def add_treated_teeth_column():
    """Добавляет поле treated_teeth в таблицу treatment_plans"""
    
    # Подключение к локальной БД
    conn = psycopg2.connect(
        host='localhost',
        database='new_dental',
        user='postgres',
        password='postgres'
    )
    
    cur = conn.cursor()
    
    try:
        # Проверяем, существует ли уже поле treated_teeth
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'treatment_plans' 
            AND column_name = 'treated_teeth';
        """)
        
        if cur.fetchone():
            print("✅ Поле treated_teeth уже существует в таблице treatment_plans")
        else:
            # Добавляем поле treated_teeth
            cur.execute("""
                ALTER TABLE treatment_plans 
                ADD COLUMN treated_teeth JSON;
            """)
            print("✅ Поле treated_teeth добавлено в таблицу treatment_plans")
        
        conn.commit()
        
    except Exception as e:
        print(f"❌ Ошибка при добавлении поля treated_teeth: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    add_treated_teeth_column()