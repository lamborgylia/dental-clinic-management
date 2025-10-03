#!/usr/bin/env python3
"""
Скрипт для добавления clinic_id в таблицу services
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def add_clinic_id_to_services():
    """Добавляет колонку clinic_id в таблицу services"""
    
    # ЗАМЕНИ НА СВОЙ DATABASE_URL
    DATABASE_URL = "postgresql://dental_user:GE2r01YdmUvFGHWf0iGgjRmDFjVFRPIF@dpg-d3fsu156ubrc73cdsgag-a.singapore-postgres.render.com:5432/dental_clinic_l0tc?sslmode=require"
    
    print("🔧 ДОБАВЛЕНИЕ CLINIC_ID В ТАБЛИЦУ SERVICES")
    print("=" * 50)
    
    try:
        # Подключение к базе данных
        print("🔗 Подключение к базе данных...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Подключение установлено!")
        
        # Проверяем, есть ли уже колонка clinic_id
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'clinic_id';
        """)
        
        if cursor.fetchone():
            print("⚠️ Колонка clinic_id уже существует")
        else:
            # Добавляем колонку clinic_id
            print("➕ Добавляем колонку clinic_id...")
            cursor.execute("""
                ALTER TABLE services 
                ADD COLUMN clinic_id INTEGER REFERENCES clinics(id);
            """)
            print("✅ Колонка clinic_id добавлена")
        
        # Получаем первую клинику
        cursor.execute("SELECT id FROM clinics ORDER BY id LIMIT 1;")
        clinic_id = cursor.fetchone()[0]
        print(f"🏥 Используем клинику ID: {clinic_id}")
        
        # Обновляем все услуги, добавляя clinic_id
        cursor.execute("""
            UPDATE services 
            SET clinic_id = %s 
            WHERE clinic_id IS NULL;
        """, (clinic_id,))
        
        updated_count = cursor.rowcount
        print(f"✅ Обновлено услуг: {updated_count}")
        
        # Делаем колонку обязательной
        print("🔒 Делаем clinic_id обязательной...")
        cursor.execute("""
            ALTER TABLE services 
            ALTER COLUMN clinic_id SET NOT NULL;
        """)
        print("✅ Колонка clinic_id теперь обязательная")
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM services WHERE clinic_id IS NOT NULL;")
        services_with_clinic = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM services;")
        total_services = cursor.fetchone()[0]
        
        print(f"📊 Всего услуг: {total_services}")
        print(f"📊 Услуг с клиникой: {services_with_clinic}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 50)
        print("🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🔧 ДОБАВЛЕНИЕ CLINIC_ID В ТАБЛИЦУ SERVICES")
    print("Добавление колонки и обновление данных")
    print("=" * 50)
    
    success = add_clinic_id_to_services()
    if success:
        print("\n✅ ГОТОВО!")
    else:
        print("\n💥 ОШИБКА!")
