#!/usr/bin/env python3
"""
Скрипт для проверки общего количества записей в базе данных
"""

import requests
import json
from datetime import datetime, timedelta

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
APPOINTMENTS_URL = f"{BASE_URL}/appointments/"

# Данные для входа
LOGIN_DATA = {
    "username": "+77771234567",
    "password": "1234"
}

def login():
    """Вход в систему"""
    try:
        response = requests.post(LOGIN_URL, data=LOGIN_DATA)
        if response.status_code == 200:
            data = response.json()
            return data['access_token']
        else:
            print(f"❌ Ошибка входа: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return None

def main():
    print("🔍 Проверяем общее количество записей в базе данных...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Получаем записи без фильтра по врачу
    response = requests.get(APPOINTMENTS_URL, headers=headers)
    all_appointments = response.json()
    
    print(f"📊 Всего записей в базе: {len(all_appointments)}")
    
    # Группируем по врачам
    doctors_count = {}
    for apt in all_appointments:
        doctor_id = apt.get('doctor_id')
        if doctor_id not in doctors_count:
            doctors_count[doctor_id] = 0
        doctors_count[doctor_id] += 1
    
    print(f"\n👨‍⚕️ Записи по врачам:")
    for doctor_id, count in doctors_count.items():
        print(f"  Врач {doctor_id}: {count} записей")
    
    # Проверяем записи на текущую неделю
    today_2025 = datetime.now().replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print(f"\n📅 Текущая неделя: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    current_week_count = 0
    current_week_by_doctor = {}
    
    for apt in all_appointments:
        apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
        if start_of_week.date() <= apt_date.date() <= end_of_week.date():
            current_week_count += 1
            doctor_id = apt.get('doctor_id')
            if doctor_id not in current_week_by_doctor:
                current_week_by_doctor[doctor_id] = 0
            current_week_by_doctor[doctor_id] += 1
    
    print(f"📅 Всего записей на текущую неделю: {current_week_count}")
    
    print(f"\n👨‍⚕️ Записи на текущую неделю по врачам:")
    for doctor_id, count in current_week_by_doctor.items():
        print(f"  Врач {doctor_id}: {count} записей")
    
    # Показываем последние 10 записей
    print(f"\n📋 Последние 10 записей:")
    sorted_appointments = sorted(all_appointments, key=lambda x: x.get('created_at', ''), reverse=True)
    for i, apt in enumerate(sorted_appointments[:10]):
        apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
        created_date = datetime.fromisoformat(apt.get('created_at', '').replace('Z', '+00:00'))
        print(f"  {i+1}. Врач {apt.get('doctor_id')} - {apt.get('patient_name', 'N/A')} - {apt_date.strftime('%d.%m.%Y %H:%M')} (создана: {created_date.strftime('%d.%m.%Y %H:%M')})")

if __name__ == "__main__":
    main()

