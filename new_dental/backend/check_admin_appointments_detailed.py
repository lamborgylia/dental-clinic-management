#!/usr/bin/env python3
"""
Скрипт для детальной проверки записей администратора
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
    print("🔍 Детальная проверка записей администратора...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Определяем текущую неделю
    today_2025 = datetime.now().replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print(f"📅 Текущая неделя: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    # Получаем записи для администратора
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(APPOINTMENTS_URL, headers=headers, params={"doctor_id": 1})
    appointments = response.json()
    
    print(f"📊 Всего записей для администратора: {len(appointments)}")
    
    # Фильтруем записи на текущую неделю
    current_week_appointments = []
    for apt in appointments:
        apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
        if start_of_week.date() <= apt_date.date() <= end_of_week.date():
            current_week_appointments.append(apt)
    
    print(f"📅 Записей на текущую неделю: {len(current_week_appointments)}")
    
    if current_week_appointments:
        print(f"\n📋 Все записи на текущую неделю:")
        for i, apt in enumerate(current_week_appointments):
            apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
            print(f"  {i+1}. {apt.get('patient_name', 'N/A')} - {apt_date.strftime('%d.%m.%Y %H:%M')}")
    
    # Проверяем записи по дням
    print(f"\n📅 Записи по дням недели:")
    current_day = start_of_week
    for i in range(7):
        day_name = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'][i]
        day_appointments = [apt for apt in current_week_appointments 
                          if datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00')).date() == current_day.date()]
        print(f"  {day_name} ({current_day.strftime('%d.%m.%Y')}): {len(day_appointments)} записей")
        current_day += timedelta(days=1)

if __name__ == "__main__":
    main()

