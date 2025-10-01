#!/usr/bin/env python3
"""
Скрипт для создания записей на текущую неделю 2025 года
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
PATIENTS_URL = f"{BASE_URL}/patients/"
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

def get_patients(token):
    """Получение списка пациентов"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(PATIENTS_URL, headers=headers, params={"page": 1, "size": 50})
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
        if response.status_code == 200 or response.status_code == 201:
            return response.json()
        else:
            print(f"❌ Ошибка создания записи: {response.status_code}")
            print(f"📄 Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания записи: {e}")
        return None

def main():
    print("🚀 Создаем записи на текущую неделю 2025 года...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем пациентов
    patients = get_patients(token)
    print(f"📊 Найдено пациентов: {len(patients)}")
    
    if not patients:
        print("❌ Нет пациентов для создания записей")
        return
    
    # Врачи
    doctors = [
        {"id": 1, "full_name": "Доктор Айдар"},
        {"id": 2, "full_name": "Доктор Асель"},
        {"id": 3, "full_name": "Доктор Данияр"}
    ]
    
    # Услуги
    services = [
        "Консультация", "Лечение кариеса", "Пломбирование", "Чистка зубов",
        "Удаление зуба", "Протезирование", "Имплантация", "Ортодонтия",
        "Лечение десен", "Отбеливание зубов"
    ]
    
    # Создаем записи на текущую неделю (2025 год)
    appointments_created = 0
    today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    
    print(f"📅 Создаем записи начиная с: {today.strftime('%d.%m.%Y')}")
    
    # Создаем записи на следующие 7 дней
    for day_offset in range(7):
        appointment_date = today + timedelta(days=day_offset)
        
        # Создаем 3-5 записей в день
        num_appointments = random.randint(3, 5)
        
        for i in range(num_appointments):
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            service = random.choice(services)
            
            # Случайное время в рабочее время (9:00 - 18:00)
            appointment_time = appointment_date.replace(
                hour=random.randint(9, 18),
                minute=random.choice([0, 30])
            )
            
            appointment_data = {
                "patient_id": patient['id'],
                "doctor_id": doctor['id'],
                "registrar_id": 1,  # ID администратора
                "appointment_datetime": appointment_time.isoformat(),
                "service_type": service,
                "notes": f"Запись на {service} для {patient['full_name']}",
                "status": "scheduled"
            }
            
            appointment = create_appointment(token, appointment_data)
            if appointment:
                appointments_created += 1
                print(f"✅ Создана запись {appointments_created}: {patient['full_name']} - {appointment_time.strftime('%d.%m.%Y %H:%M')}")
            else:
                print(f"❌ Не удалось создать запись для {patient['full_name']}")
    
    print(f"\n🎉 Готово!")
    print(f"📅 Создано записей: {appointments_created}")
    print(f"📅 Записи созданы на период: {today.strftime('%d.%m.%Y')} - {(today + timedelta(days=6)).strftime('%d.%m.%Y')}")

if __name__ == "__main__":
    main()

