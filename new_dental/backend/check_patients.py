#!/usr/bin/env python3
"""
Скрипт для проверки пациентов в системе
"""

import requests
import json

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
PATIENTS_URL = f"{BASE_URL}/patients/"

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

def get_patients(token):
    """Получение списка пациентов"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(PATIENTS_URL, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get('patients', [])
        else:
            print(f"❌ Ошибка получения пациентов: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения пациентов: {e}")
        return []

def main():
    print("🔍 Проверяем пациентов в системе...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем пациентов
    patients = get_patients(token)
    print(f"📊 Всего пациентов в системе: {len(patients)}")
    
    # Показываем первых 10 пациентов
    print("\n📋 Первые 10 пациентов:")
    for i, patient in enumerate(patients[:10]):
        print(f"  {i+1}. {patient.get('full_name', 'N/A')} - {patient.get('phone', 'N/A')}")
    
    if len(patients) > 10:
        print(f"  ... и еще {len(patients) - 10} пациентов")

if __name__ == "__main__":
    main()

