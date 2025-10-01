#!/usr/bin/env python3
"""
Скрипт для проверки последних созданных записей
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
    print("🔍 Проверяем последние созданные записи...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Получаем записи для врача 6
    response = requests.get(APPOINTMENTS_URL, headers=headers, params={"doctor_id": 6})
    appointments = response.json()
    
    print(f"📊 Всего записей для врача 6: {len(appointments)}")
    
    # Сортируем по дате создания (самые новые первыми)
    appointments.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    print(f"\n📋 Последние 10 записей:")
    for i, apt in enumerate(appointments[:10]):
        apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
        created_date = datetime.fromisoformat(apt.get('created_at', '').replace('Z', '+00:00'))
        print(f"  {i+1}. {apt.get('patient_name', 'N/A')} - {apt_date.strftime('%d.%m.%Y %H:%M')} (создана: {created_date.strftime('%d.%m.%Y %H:%M')})")
    
    # Проверяем записи на текущую неделю
    today_2025 = datetime.now().replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print(f"\n📅 Текущая неделя: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    current_week_appointments = []
    for apt in appointments:
        apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
        if start_of_week.date() <= apt_date.date() <= end_of_week.date():
            current_week_appointments.append(apt)
    
    print(f"📅 Записей на текущую неделю: {len(current_week_appointments)}")
    
    if current_week_appointments:
        print(f"\n📋 Записи на текущую неделю:")
        for i, apt in enumerate(current_week_appointments[:10]):
            apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
            print(f"  {i+1}. {apt.get('patient_name', 'N/A')} - {apt_date.strftime('%d.%m.%Y %H:%M')}")

if __name__ == "__main__":
    main()

