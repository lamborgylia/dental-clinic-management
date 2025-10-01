#!/usr/bin/env python3
"""
Скрипт для подсчета всех записей в базе данных
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
    print("🔍 Подсчитываем все записи в базе данных...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Получаем записи для всех врачей
    doctors = [1, 2, 6]  # Администратор и два врача
    total_appointments = 0
    
    for doctor_id in doctors:
        response = requests.get(APPOINTMENTS_URL, headers=headers, params={"doctor_id": doctor_id})
        appointments = response.json()
        
        print(f"👨‍⚕️ Врач {doctor_id}: {len(appointments)} записей")
        total_appointments += len(appointments)
        
        # Показываем даты записей
        if appointments:
            dates = []
            for apt in appointments[:5]:
                apt_date = apt['appointment_datetime'].split('T')[0]
                dates.append(apt_date)
            print(f"  📅 Первые 5 дат: {dates}")
    
    print(f"\n📊 Всего записей в базе: {total_appointments}")
    
    # Проверяем записи на текущую неделю
    today_2025 = datetime.now().replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print(f"\n📅 Текущая неделя: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    current_week_count = 0
    for doctor_id in doctors:
        response = requests.get(APPOINTMENTS_URL, headers=headers, params={"doctor_id": doctor_id})
        appointments = response.json()
        
        current_week_appointments = []
        for apt in appointments:
            apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
            if start_of_week.date() <= apt_date.date() <= end_of_week.date():
                current_week_appointments.append(apt)
        
        print(f"👨‍⚕️ Врач {doctor_id} на текущую неделю: {len(current_week_appointments)} записей")
        current_week_count += len(current_week_appointments)
    
    print(f"\n📅 Всего записей на текущую неделю: {current_week_count}")

if __name__ == "__main__":
    main()

