#!/usr/bin/env python3
"""
Скрипт для исправления услуг в базе данных
Добавляет clinic_id к существующим услугам
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def fix_services():
    """Исправляет услуги, добавляя clinic_id"""
    
    # ЗАМЕНИ НА СВОЙ DATABASE_URL
    DATABASE_URL = "postgresql://dental_user:GE2r01YdmUvFGHWf0iGgjRmDFjVFRPIF@dpg-d3fsu156ubrc73cdsgag-a.singapore-postgres.render.com:5432/dental_clinic_l0tc?sslmode=require"
    
    print("🔧 ИСПРАВЛЕНИЕ УСЛУГ В БАЗЕ ДАННЫХ")
    print("=" * 50)
    
    try:
        # Подключение к базе данных
        print("🔗 Подключение к базе данных...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Подключение установлено!")
        
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
    print("🔧 ИСПРАВЛЕНИЕ УСЛУГ В БАЗЕ ДАННЫХ")
    print("Добавление clinic_id к существующим услугам")
    print("=" * 50)
    
    success = fix_services()
    if success:
        print("\n✅ ГОТОВО!")
    else:
        print("\n💥 ОШИБКА!")
