#!/usr/bin/env python3
"""
Скрипт для тестирования пагинированного API записей
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

def test_paginated_api(token, doctor_id):
    """Тестируем пагинированный API"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🔍 Тестируем пагинированный API для врача {doctor_id}...")
    
    all_appointments = []
    page = 1
    page_size = 100
    
    while True:
        print(f"  📄 Страница {page}...")
        response = requests.get(APPOINTMENTS_URL, headers=headers, params={
            "doctor_id": doctor_id,
            "page": page,
            "size": page_size
        })
        
        if response.status_code != 200:
            print(f"  ❌ Ошибка на странице {page}: {response.status_code}")
            break
        
        appointments = response.json()
        print(f"  📊 Получено записей: {len(appointments)}")
        
        if not appointments or len(appointments) == 0:
            print(f"  ✅ Страница {page} пустая, завершаем")
            break
        
        all_appointments.extend(appointments)
        
        if len(appointments) < page_size:
            print(f"  ✅ Получено меньше {page_size} записей, это последняя страница")
            break
        
        page += 1
    
    print(f"📊 Всего записей для врача {doctor_id}: {len(all_appointments)}")
    
    # Проверяем записи на текущую неделю
    today_2025 = datetime.now().replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    current_week_appointments = []
    for apt in all_appointments:
        apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
        if start_of_week.date() <= apt_date.date() <= end_of_week.date():
            current_week_appointments.append(apt)
    
    print(f"📅 Записей на текущую неделю: {len(current_week_appointments)}")
    
    return len(all_appointments), len(current_week_appointments)

def main():
    print("🔍 Тестируем пагинированный API записей...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Тестируем для всех врачей
    doctors = [1, 2, 6]
    total_appointments = 0
    total_current_week = 0
    
    for doctor_id in doctors:
        appointments_count, current_week_count = test_paginated_api(token, doctor_id)
        total_appointments += appointments_count
        total_current_week += current_week_count
        print()
    
    print(f"🎯 Итого записей: {total_appointments}")
    print(f"🎯 Итого записей на текущую неделю: {total_current_week}")

if __name__ == "__main__":
    main()

