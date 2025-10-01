#!/usr/bin/env python3
"""
Скрипт для создания записей на текущие даты
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
APPOINTMENTS_URL = f"{BASE_URL}/appointments/"
PATIENTS_URL = f"{BASE_URL}/patients/"

# Данные для входа
LOGIN_DATA = {
    "username": "+77771234567",
    "password": "1234"
}

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

def create_appointment(token, appointment_data):
    """Создание записи"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(APPOINTMENTS_URL, json=appointment_data, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка создания записи: {response.status_code}")
            if response.status_code == 422:
                print(f"📄 Детали ошибки: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания записи: {e}")
        return None

def main():
    print("🚀 Создаем записи на текущие даты...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем существующих пациентов
    patients = get_patients(token)
    if not patients:
        print("❌ Не удалось получить список пациентов")
        return
    
    print(f"📊 Найдено пациентов: {len(patients)}")
    
    # Создаем записи на текущую неделю (исправляем год на 2024)
    appointments_created = 0
    today = datetime.now().replace(year=2024, hour=9, minute=0, second=0, microsecond=0)
    
    # Создаем записи на следующие 7 дней
    for day_offset in range(7):
        appointment_date = today + timedelta(days=day_offset)
        
        # Создаем 2-3 записи на каждый день
        for i in range(random.randint(2, 3)):
            # Выбираем случайного пациента
            patient = random.choice(patients)
            
            # Выбираем случайного врача
            doctor = random.choice(DOCTORS)
            
            # Выбираем случайную услугу
            service = random.choice(SERVICES)
            
            # Создаем время (9:00 - 17:00)
            appointment_time = appointment_date.replace(
                hour=random.randint(9, 17),
                minute=random.choice([0, 30])
            )
            
            # Создаем данные записи
            appointment_data = {
                "patient_id": patient['id'],
                "doctor_id": doctor['id'],
                "appointment_datetime": appointment_time.isoformat(),
                "service_type": service,
                "notes": f"Запись на {appointment_time.strftime('%d.%m.%Y')}",
                "status": "scheduled",
                "registrar_id": 1
            }
            
            # Создаем запись
            appointment = create_appointment(token, appointment_data)
            if appointment:
                appointments_created += 1
                print(f"✅ Создана запись: {patient['full_name']} - {service} - {appointment_time.strftime('%d.%m.%Y %H:%M')}")
            else:
                print(f"❌ Не удалось создать запись на {appointment_time.strftime('%d.%m.%Y %H:%M')}")
    
    print(f"🎉 Готово! Создано записей: {appointments_created}")
    print(f"📊 Всего пациентов: {len(patients)}")
    print(f"📅 Записи созданы на период: {today.strftime('%d.%m.%Y')} - {(today + timedelta(days=6)).strftime('%d.%m.%Y')}")

if __name__ == "__main__":
    main()
