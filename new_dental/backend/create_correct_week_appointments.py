#!/usr/bin/env python3
"""
Скрипт для создания записей на правильную неделю 2025 года
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
        response = requests.get(PATIENTS_URL, headers=headers, params={"page": 1, "size": 100})
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
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = requests.post(APPOINTMENTS_URL, headers=headers, data=json.dumps(appointment_data))
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка создания записи: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания записи: {e}")
        return None

def main():
    print("🚀 Создаем записи на правильную неделю 2025 года...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем пациентов
    patients = get_patients(token)
    if not patients:
        print("❌ Нет пациентов для создания записей")
        return
    
    print(f"📊 Найдено пациентов: {len(patients)}")
    
    # Определяем текущую неделю 2025 года (исправляем год)
    today = datetime.now()
    today_2025 = today.replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())  # Понедельник
    end_of_week = start_of_week + timedelta(days=6)  # Воскресенье
    
    print(f"📅 Создаем записи на неделю: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    # Создаем записи для врача 6 (Федор) - у него больше всего записей
    doctor_id = 6
    appointments_created = 0
    services = [
        "Консультация", "Лечение кариеса", "Пломбирование", "Чистка зубов",
        "Удаление зуба", "Протезирование", "Имплантация", "Ортодонтия",
        "Лечение десен", "Отбеливание зубов", "Рентген", "Лечение корневых каналов"
    ]
    
    # Создаем по 20-25 записей в день для врача 6
    current_day = start_of_week
    while current_day <= end_of_week:
        print(f"\n📅 Создаем записи на {current_day.strftime('%d.%m.%Y')}...")
        
        # Создаем 20-25 записей в день
        num_appointments = random.randint(20, 25)
        
        for i in range(num_appointments):
            patient = random.choice(patients)
            service = random.choice(services)
            
            # Случайное время в рабочее время (8:00 - 19:00)
            appointment_time = current_day.replace(
                hour=random.randint(8, 19),
                minute=random.choice([0, 15, 30, 45]),
                second=0,
                microsecond=0
            )
            
            appointment_data = {
                "patient_id": patient['id'],
                "doctor_id": doctor_id,
                "registrar_id": 1,
                "appointment_datetime": appointment_time.isoformat(),
                "service_type": service,
                "notes": f"Запись на {service} для {patient['full_name']}",
                "status": "scheduled"
            }
            
            appointment = create_appointment(token, appointment_data)
            if appointment:
                appointments_created += 1
                if appointments_created % 50 == 0:
                    print(f"  ✅ Создано записей: {appointments_created}")
        
        current_day += timedelta(days=1)
    
    print(f"\n🎉 Готово!")
    print(f"📅 Создано записей на текущую неделю: {appointments_created}")
    print(f"📅 Записи созданы на период: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    print(f"👨‍⚕️ Записи созданы для врача ID {doctor_id} (Федор)")

if __name__ == "__main__":
    main()

