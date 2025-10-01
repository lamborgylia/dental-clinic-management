#!/usr/bin/env python3
"""
Скрипт для прямой проверки базы данных
"""

import sqlite3
from datetime import datetime, timedelta

def main():
    print("🔍 Проверяем базу данных напрямую...")
    
    # Подключаемся к базе данных
    conn = sqlite3.connect('/Users/maksimdudaruk/Desktop/new_dental/new_dental/backend/appointments.db')
    cursor = conn.cursor()
    
    # Получаем общее количество записей
    cursor.execute("SELECT COUNT(*) FROM appointments")
    total_count = cursor.fetchone()[0]
    print(f"📊 Всего записей в базе данных: {total_count}")
    
    # Получаем записи по врачам
    cursor.execute("SELECT doctor_id, COUNT(*) FROM appointments GROUP BY doctor_id")
    doctors_count = cursor.fetchall()
    
    print(f"\n👨‍⚕️ Записи по врачам:")
    for doctor_id, count in doctors_count:
        print(f"  Врач {doctor_id}: {count} записей")
    
    # Определяем текущую неделю 2025 года
    today = datetime.now()
    today_2025 = today.replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print(f"\n📅 Текущая неделя: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    # Получаем записи на текущую неделю
    cursor.execute("""
        SELECT doctor_id, COUNT(*) 
        FROM appointments 
        WHERE DATE(appointment_datetime) BETWEEN ? AND ?
        GROUP BY doctor_id
    """, (start_of_week.date().isoformat(), end_of_week.date().isoformat()))
    
    current_week_count = cursor.fetchall()
    
    print(f"\n👨‍⚕️ Записи на текущую неделю по врачам:")
    total_current_week = 0
    for doctor_id, count in current_week_count:
        print(f"  Врач {doctor_id}: {count} записей")
        total_current_week += count
    
    print(f"\n📅 Всего записей на текущую неделю: {total_current_week}")
    
    # Показываем последние 10 записей
    cursor.execute("""
        SELECT doctor_id, patient_name, appointment_datetime, created_at
        FROM appointments 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    
    recent_appointments = cursor.fetchall()
    
    print(f"\n📋 Последние 10 записей:")
    for i, (doctor_id, patient_name, appointment_datetime, created_at) in enumerate(recent_appointments):
        apt_date = datetime.fromisoformat(appointment_datetime.replace('Z', '+00:00'))
        created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        print(f"  {i+1}. Врач {doctor_id} - {patient_name} - {apt_date.strftime('%d.%m.%Y %H:%M')} (создана: {created_date.strftime('%d.%m.%Y %H:%M')})")
    
    conn.close()

if __name__ == "__main__":
    main()

