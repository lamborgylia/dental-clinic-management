#!/usr/bin/env python3
"""
Скрипт для отладки получения пациентов
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
            return response.json()
        else:
            print(f"❌ Ошибка получения пациентов: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения пациентов: {e}")
        return []

def main():
    print("🔍 Отладка получения пациентов...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем существующих пациентов
    patients = get_patients(token)
    print(f"📊 Получено пациентов: {len(patients)}")
    
    # Выводим структуру данных
    print("\n📋 Структура данных:")
    for i, patient in enumerate(patients):
        print(f"Пациент {i+1}:")
        print(f"  Тип: {type(patient)}")
        print(f"  Данные: {patient}")
        print()

if __name__ == "__main__":
    main()

