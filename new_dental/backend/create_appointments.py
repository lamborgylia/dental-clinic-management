#!/usr/bin/env python3
"""
Скрипт для создания множества записей в календарь
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
APPOINTMENTS_URL = f"{BASE_URL}/appointments/"

# Данные для входа
LOGIN_DATA = {
    "username": "+77771234567",
    "password": "1234"
}

# Список пациентов (добавим больше)
PATIENTS = [
    {"name": "Айдар Нурланов", "phone": "+77771234567", "iin": "123456789012"},
    {"name": "Асель Касымова", "phone": "+77771234568", "iin": "123456789013"},
    {"name": "Данияр Ахметов", "phone": "+77771234569", "iin": "123456789014"},
    {"name": "Жанар Бектасова", "phone": "+77771234570", "iin": "123456789015"},
    {"name": "Ерлан Садыков", "phone": "+77771234571", "iin": "123456789016"},
    {"name": "Айгуль Толеуова", "phone": "+77771234572", "iin": "123456789017"},
    {"name": "Марат Кенжебаев", "phone": "+77771234573", "iin": "123456789018"},
    {"name": "Алма Нурпеисова", "phone": "+77771234574", "iin": "123456789019"},
    {"name": "Серик Жумабеков", "phone": "+77771234575", "iin": "123456789020"},
    {"name": "Гульнара Абдуллаева", "phone": "+77771234576", "iin": "123456789021"},
    {"name": "Нурлан Бекжанов", "phone": "+77771234577", "iin": "123456789022"},
    {"name": "Айжан Касымова", "phone": "+77771234578", "iin": "123456789023"},
    {"name": "Ержан Толеуов", "phone": "+77771234579", "iin": "123456789024"},
    {"name": "Алтынай Нурланова", "phone": "+77771234580", "iin": "123456789025"},
    {"name": "Даурен Ахметов", "phone": "+77771234581", "iin": "123456789026"},
    {"name": "Жанаргуль Бектасова", "phone": "+77771234582", "iin": "123456789027"},
    {"name": "Асылбек Садыков", "phone": "+77771234583", "iin": "123456789028"},
    {"name": "Айгуль Толеуова", "phone": "+77771234584", "iin": "123456789029"},
    {"name": "Марат Кенжебаев", "phone": "+77771234585", "iin": "123456789030"},
    {"name": "Алма Нурпеисова", "phone": "+77771234586", "iin": "123456789031"}
]

# Список услуг
SERVICES = [
    "Консультация",
    "Лечение кариеса",
    "Пломбирование",
    "Чистка зубов",
    "Удаление зуба",
    "Протезирование",
    "Имплантация",
    "Ортодонтия",
    "Лечение десен",
    "Отбеливание зубов"
]

# Список врачей
DOCTORS = [
    {"id": 1, "name": "Доктор Айдар"},
    {"id": 2, "name": "Доктор Асель"},
    {"id": 3, "name": "Доктор Данияр"}
]

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
        response = requests.post(f"{BASE_URL}/patients/", json=patient_data, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка создания пациента {patient_data['name']}: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания пациента: {e}")
        return None

def create_appointment(token, appointment_data):
    """Создание записи"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(APPOINTMENTS_URL, json=appointment_data, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка создания записи: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания записи: {e}")
        return None

def main():
    print("🚀 Начинаем создание записей в календарь...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Создаем пациентов
    patients = []
    for patient_data in PATIENTS:
        patient = create_patient(token, patient_data)
        if patient:
            patients.append(patient)
            print(f"✅ Создан пациент: {patient_data['name']}")
        else:
            print(f"❌ Не удалось создать пациента: {patient_data['name']}")
    
    print(f"📊 Создано пациентов: {len(patients)}")
    
    # Создаем записи
    appointments_created = 0
    start_date = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    
    for i in range(50):  # Создаем 50 записей
        # Выбираем случайного пациента
        patient = random.choice(patients)
        
        # Выбираем случайного врача
        doctor = random.choice(DOCTORS)
        
        # Выбираем случайную услугу
        service = random.choice(SERVICES)
        
        # Создаем дату и время (в течение следующих 30 дней)
        appointment_date = start_date + timedelta(days=random.randint(0, 30))
        appointment_time = appointment_date.replace(
            hour=random.randint(9, 18),
            minute=random.choice([0, 30])
        )
        
        # Создаем данные записи
        appointment_data = {
            "patient_id": patient['id'],
            "doctor_id": doctor['id'],
            "appointment_date": appointment_time.isoformat(),
            "service_type": service,
            "notes": f"Запись #{i+1}",
            "status": "scheduled"
        }
        
        # Создаем запись
        appointment = create_appointment(token, appointment_data)
        if appointment:
            appointments_created += 1
            print(f"✅ Создана запись #{i+1}: {patient['full_name']} - {service} - {appointment_time.strftime('%d.%m.%Y %H:%M')}")
        else:
            print(f"❌ Не удалось создать запись #{i+1}")
    
    print(f"🎉 Готово! Создано записей: {appointments_created}")
    print(f"📊 Всего пациентов: {len(patients)}")
    print(f"📅 Записи созданы на период: {start_date.strftime('%d.%m.%Y')} - {(start_date + timedelta(days=30)).strftime('%d.%m.%Y')}")

if __name__ == "__main__":
    main()