#!/usr/bin/env python3
"""
Скрипт для тестирования API пациентов клиники
"""

import requests
import json

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
CLINIC_PATIENTS_URL = f"{BASE_URL}/clinic-patients/"

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

def test_clinic_patients_api(token):
    """Тестируем API пациентов клиники"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Тест API пациентов клиники ===")
    
    # Тест с разными размерами
    for size in [10, 20, 200]:
        try:
            response = requests.get(f"{CLINIC_PATIENTS_URL}?page=1&size={size}", headers=headers)
            print(f"📊 Статус (size={size}): {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"📋 Тип данных: {type(data)}")
                if isinstance(data, dict):
                    print(f"📋 Структура: {list(data.keys())}")
                    print(f"📊 Всего пациентов: {data.get('total', 'N/A')}")
                    print(f"📊 Пациентов на странице: {len(data.get('patients', []))}")
                    patients = data.get('patients', [])
                elif isinstance(data, list):
                    print(f"📊 Пациентов на странице: {len(data)}")
                    patients = data
                else:
                    print(f"📊 Неожиданный тип данных: {type(data)}")
                    patients = []
                
                if patients:
                    print(f"📋 Первые 3 пациента:")
                    for i, patient in enumerate(patients[:3]):
                        print(f"  {i+1}. {patient.get('patient_name', patient.get('full_name', 'N/A'))} - {patient.get('patient_phone', patient.get('phone', 'N/A'))}")
                        print(f"      Поля: {list(patient.keys())}")
                print()
            else:
                print(f"❌ Ошибка: {response.text}")
                print()
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            print()

def main():
    print("🔍 Тестируем API пациентов клиники...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Тестируем API
    test_clinic_patients_api(token)

if __name__ == "__main__":
    main()
