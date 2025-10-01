#!/usr/bin/env python3
"""
Скрипт для создания множества пациентов и записей
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

# Список казахских имен и фамилий
FIRST_NAMES = [
    "Айдар", "Асель", "Данияр", "Жанар", "Ерлан", "Айгуль", "Марат", "Алма", "Серик", "Гульнара",
    "Нурлан", "Айжан", "Ержан", "Алтынай", "Даурен", "Жанаргуль", "Асылбек", "Айнур", "Бекжан", "Гульмира",
    "Ерболат", "Жанат", "Камила", "Ляззат", "Мейрам", "Нуржан", "Орынбай", "Перизат", "Раушан", "Салтанат",
    "Талгат", "Улжан", "Фарида", "Хадиша", "Шолпан", "Эльмира", "Юлия", "Ясмин", "Айбек", "Бакыт",
    "Данияр", "Ермек", "Жанар", "Кайрат", "Лейла", "Марат", "Нурсулу", "Олжас", "Перизат", "Раушан"
]

LAST_NAMES = [
    "Нурланов", "Касымова", "Ахметов", "Бектасова", "Садыков", "Толеуова", "Кенжебаев", "Нурпеисова",
    "Жумабеков", "Абдуллаева", "Бекжанов", "Касымова", "Толеуов", "Нурланова", "Ахметов", "Бектасова",
    "Садыков", "Толеуова", "Кенжебаев", "Нурпеисова", "Жумабеков", "Абдуллаева", "Бекжанов", "Касымова",
    "Толеуов", "Нурланова", "Ахметов", "Бектасова", "Садыков", "Толеуова", "Кенжебаев", "Нурпеисова",
    "Жумабеков", "Абдуллаева", "Бекжанов", "Касымова", "Толеуов", "Нурланова", "Ахметов", "Бектасова",
    "Садыков", "Толеуова", "Кенжебаев", "Нурпеисова", "Жумабеков", "Абдуллаева", "Бекжанов", "Касымова"
]

# Список услуг
SERVICES = [
    "Консультация", "Лечение кариеса", "Пломбирование", "Чистка зубов", "Удаление зуба",
    "Протезирование", "Имплантация", "Ортодонтия", "Лечение десен", "Отбеливание зубов",
    "Лечение пульпита", "Пародонтология", "Детская стоматология", "Хирургическая стоматология",
    "Эстетическая стоматология", "Эндодонтия", "Профилактика", "Диагностика"
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
        response = requests.post(PATIENTS_URL, json=patient_data, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка создания пациента {patient_data['full_name']}: {response.status_code}")
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
            return None
    except Exception as e:
        return None

def generate_phone():
    """Генерация номера телефона"""
    return f"+7777{random.randint(1000000, 9999999)}"

def generate_iin():
    """Генерация ИИН"""
    return f"{random.randint(100000000000, 999999999999)}"

def generate_birth_date():
    """Генерация даты рождения"""
    start_date = datetime(1950, 1, 1)
    end_date = datetime(2010, 12, 31)
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randint(0, days_between)
    birth_date = start_date + timedelta(days=random_days)
    return birth_date.strftime('%Y-%m-%d')

def main():
    print("🚀 Создаем множество пациентов и записей...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Создаем 50 пациентов
    patients = []
    for i in range(50):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        full_name = f"{last_name} {first_name} {last_name}ович" if i % 2 == 0 else f"{last_name}а {first_name} {last_name}овна"
        
        patient_data = {
            "full_name": full_name,
            "phone": generate_phone(),
            "iin": generate_iin(),
            "birth_date": generate_birth_date(),
            "allergies": random.choice(["Нет", "Пенициллин", "Латекс", "Металлы", "Анестетики"]) if random.random() < 0.3 else "",
            "chronic_diseases": random.choice(["Нет", "Диабет", "Гипертония", "Астма", "Сердечные заболевания"]) if random.random() < 0.2 else "",
            "contraindications": random.choice(["Нет", "Беременность", "Кормление грудью", "Прием антикоагулянтов"]) if random.random() < 0.1 else "",
            "special_notes": random.choice(["Нет", "Боязнь стоматолога", "Особые требования", "VIP клиент"]) if random.random() < 0.15 else ""
        }
        
        patient = create_patient(token, patient_data)
        if patient:
            patients.append(patient)
            print(f"✅ Создан пациент {i+1}/50: {full_name}")
        else:
            print(f"❌ Не удалось создать пациента {i+1}/50: {full_name}")
    
    print(f"📊 Создано пациентов: {len(patients)}")
    
    # Создаем записи на следующие 30 дней
    appointments_created = 0
    today = datetime.now().replace(year=2024, hour=9, minute=0, second=0, microsecond=0)
    
    for day_offset in range(30):
        appointment_date = today + timedelta(days=day_offset)
        
        # Создаем 5-8 записей на каждый день
        daily_appointments = random.randint(5, 8)
        for i in range(daily_appointments):
            # Выбираем случайного пациента
            patient = random.choice(patients)
            
            # Выбираем случайного врача
            doctor = random.choice(DOCTORS)
            
            # Выбираем случайную услугу
            service = random.choice(SERVICES)
            
            # Создаем время (9:00 - 18:00)
            appointment_time = appointment_date.replace(
                hour=random.randint(9, 18),
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
                if appointments_created % 50 == 0:
                    print(f"✅ Создано записей: {appointments_created}")
    
    print(f"🎉 Готово!")
    print(f"📊 Создано пациентов: {len(patients)}")
    print(f"📅 Создано записей: {appointments_created}")
    print(f"📅 Записи созданы на период: {today.strftime('%d.%m.%Y')} - {(today + timedelta(days=29)).strftime('%d.%m.%Y')}")

if __name__ == "__main__":
    main()

