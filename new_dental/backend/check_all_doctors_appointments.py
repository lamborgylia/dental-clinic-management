#!/usr/bin/env python3
"""
Скрипт для проверки записей для всех врачей
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

def get_appointments_for_doctor(token, doctor_id):
    """Получение записей для конкретного врача"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{APPOINTMENTS_URL}?doctor_id={doctor_id}", headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка получения записей для врача {doctor_id}: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения записей для врача {doctor_id}: {e}")
        return []

def main():
    print("🔍 Проверяем записи для всех врачей...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Проверяем записи для каждого врача
    doctors = [1, 2, 3]
    
    for doctor_id in doctors:
        appointments = get_appointments_for_doctor(token, doctor_id)
        print(f"\n👨‍⚕️ Врач {doctor_id}: {len(appointments)} записей")
        
        if appointments:
            # Показываем первые 5 записей
            print(f"📋 Первые 5 записей:")
            for i, apt in enumerate(appointments[:5]):
                apt_date = apt['appointment_datetime'][:10]  # Только дата
                print(f"  {i+1}. {apt.get('patient_name', 'N/A')} - {apt_date}")
        else:
            print("❌ Нет записей")

if __name__ == "__main__":
    main()

