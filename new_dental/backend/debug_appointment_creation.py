#!/usr/bin/env python3
"""
Отладка создания записи
"""

import requests
import json
from datetime import datetime, timedelta

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
APPOINTMENTS_URL = f"{BASE_URL}/appointments/"

def login():
    """Вход в систему"""
    login_data = {
        "username": "+77771234567",
        "password": "1234"
    }
    
    try:
        response = requests.post(LOGIN_URL, data=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"❌ Ошибка входа: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка входа: {e}")
        return None

def create_test_appointment(token):
    """Создаем тестовую запись с отладкой"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Создаем время на завтра
    tomorrow = datetime.now() + timedelta(days=1)
    appointment_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
    
    appointment_data = {
        "patient_id": 1,
        "doctor_id": 6,
        "appointment_datetime": appointment_time.isoformat(),
        "service_type": "Тестовая услуга",
        "notes": "Тестовая запись для отладки",
        "status": "scheduled",
        "registrar_id": 1
    }
    
    print("📤 Отправляем данные:")
    print(json.dumps(appointment_data, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(APPOINTMENTS_URL, json=appointment_data, headers=headers)
        print(f"\n📥 Ответ сервера:")
        print(f"Статус: {response.status_code}")
        print(f"Текст ответа: {response.text}")
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        print(f"❌ Ошибка создания записи: {e}")
        return None

def main():
    print("🔍 Отладка создания записи...")
    
    # Входим в систему
    token = login()
    if not token:
        return
    
    print("✅ Успешный вход в систему")
    
    # Создаем тестовую запись
    appointment = create_test_appointment(token)
    
    if appointment:
        print(f"\n✅ Запись создана:")
        print(f"ID: {appointment.get('id')}")
        print(f"Service Type: {appointment.get('service_type')}")
        print(f"Notes: {appointment.get('notes')}")
    else:
        print("❌ Не удалось создать запись")

if __name__ == "__main__":
    main()

