#!/usr/bin/env python3
"""
Скрипт для отладки создания пациентов
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

def create_patient(token, patient_data):
    """Создание пациента"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        print(f"🔍 Создаем пациента: {patient_data['full_name']}")
        print(f"📋 Данные: {json.dumps(patient_data, ensure_ascii=False, indent=2)}")
        
        response = requests.post(PATIENTS_URL, json=patient_data, headers=headers)
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code == 200 or response.status_code == 201:
            patient = response.json()
            print(f"✅ Пациент создан: {patient.get('full_name', 'N/A')}")
            return patient
        else:
            print(f"❌ Ошибка создания пациента: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания пациента: {e}")
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
    print("🔍 Отладка создания пациентов...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Проверяем текущее количество пациентов
    patients_before = get_patients(token)
    print(f"📊 Пациентов до создания: {len(patients_before)}")
    
    # Создаем тестового пациента
    test_patient = {
        "full_name": "Тестовый Пациент Тестович",
        "phone": "+77779998877",
        "iin": "123456789012",
        "birth_date": "1990-01-01",
        "address": "Тестовый адрес",
        "allergies": "Нет аллергий",
        "chronic_diseases": "Нет хронических заболеваний",
        "contraindications": "Нет противопоказаний",
        "special_notes": "Тестовый пациент"
    }
    
    # Создаем пациента
    created_patient = create_patient(token, test_patient)
    
    # Проверяем количество пациентов после создания
    patients_after = get_patients(token)
    print(f"📊 Пациентов после создания: {len(patients_after)}")
    
    if len(patients_after) > len(patients_before):
        print("✅ Пациент успешно добавлен!")
    else:
        print("❌ Пациент не был добавлен")

if __name__ == "__main__":
    main()

