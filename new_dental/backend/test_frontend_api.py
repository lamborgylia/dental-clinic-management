#!/usr/bin/env python3
"""
Скрипт для тестирования API, который использует frontend
"""

import requests
import json

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
PATIENTS_URL = f"{BASE_URL}/patients/"
APPOINTMENTS_URL = f"{BASE_URL}/appointments/"

# Данные для входа (как в frontend)
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
            print(f"📄 Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return None

def test_patients_api(token):
    """Тестируем API пациентов как frontend"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Тест API пациентов ===")
    
    # Тест 1: Без параметров (как делает frontend)
    try:
        response = requests.get(PATIENTS_URL, headers=headers)
        print(f"📊 Статус: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Структура: {list(data.keys())}")
            print(f"📊 Всего пациентов: {data.get('total', 'N/A')}")
            print(f"📊 Пациентов на странице: {len(data.get('patients', []))}")
            
            patients = data.get('patients', [])
            print(f"\n📋 Первые 5 пациентов:")
            for i, patient in enumerate(patients[:5]):
                print(f"  {i+1}. {patient.get('full_name', 'N/A')} - {patient.get('phone', 'N/A')}")
        else:
            print(f"❌ Ошибка: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

def test_appointments_api(token):
    """Тестируем API записей как frontend"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Тест API записей ===")
    
    # Тест для врача 1 (как делает календарь)
    try:
        response = requests.get(f"{APPOINTMENTS_URL}?doctor_id=1", headers=headers)
        print(f"📊 Статус: {response.status_code}")
        if response.status_code == 200:
            appointments = response.json()
            print(f"📊 Записей для врача 1: {len(appointments)}")
            
            # Показываем записи на текущую неделю
            from datetime import datetime, timedelta
            today = datetime.now()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            
            current_week_appointments = []
            for apt in appointments:
                apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
                if week_start <= apt_date <= week_end:
                    current_week_appointments.append(apt)
            
            print(f"📅 Записей на текущую неделю: {len(current_week_appointments)}")
            
            if current_week_appointments:
                print(f"\n📋 Записи на текущую неделю:")
                for apt in current_week_appointments[:10]:
                    apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
                    print(f"  - {apt.get('patient_name', 'N/A')} - {apt_date.strftime('%d.%m.%Y %H:%M')}")
        else:
            print(f"❌ Ошибка: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

def main():
    print("🔍 Тестируем API как frontend...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Тестируем API
    test_patients_api(token)
    test_appointments_api(token)

if __name__ == "__main__":
    main()

