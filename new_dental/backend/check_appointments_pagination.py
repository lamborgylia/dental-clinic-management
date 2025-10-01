#!/usr/bin/env python3
"""
Скрипт для проверки пагинации записей
"""

import requests
import json

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
    print("🔍 Проверяем пагинацию записей...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Тестируем разные параметры пагинации
    test_params = [
        {"doctor_id": 1},
        {"doctor_id": 1, "page": 1, "size": 100},
        {"doctor_id": 1, "page": 1, "size": 200},
        {"doctor_id": 1, "page": 2, "size": 100},
        {"doctor_id": 1, "page": 1, "size": 50},
    ]
    
    for params in test_params:
        print(f"\n📊 Тест с параметрами: {params}")
        try:
            response = requests.get(APPOINTMENTS_URL, headers=headers, params=params)
            print(f"  Статус: {response.status_code}")
            if response.status_code == 200:
                appointments = response.json()
                print(f"  Количество записей: {len(appointments)}")
                if appointments:
                    # Проверяем даты записей
                    dates = []
                    for apt in appointments[:5]:
                        apt_date = apt['appointment_datetime'].split('T')[0]
                        dates.append(apt_date)
                    print(f"  Первые 5 дат: {dates}")
            else:
                print(f"  Ошибка: {response.text}")
        except Exception as e:
            print(f"  Ошибка: {e}")

if __name__ == "__main__":
    main()

