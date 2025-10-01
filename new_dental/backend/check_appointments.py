#!/usr/bin/env python3
"""
Скрипт для проверки записей в календаре
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

def get_appointments(token, doctor_id=None):
    """Получение записей"""
    headers = {"Authorization": f"Bearer {token}"}
    url = APPOINTMENTS_URL
    if doctor_id:
        url += f"?doctor_id={doctor_id}"
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка получения записей: {response.status_code}")
            print(f"📄 Ответ: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения записей: {e}")
        return []

def main():
    print("🔍 Проверяем записи в календаре...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем все записи
    all_appointments = get_appointments(token)
    print(f"📊 Всего записей: {len(all_appointments)}")
    
    # Получаем записи для врача 1
    doctor_appointments = get_appointments(token, 1)
    print(f"📊 Записей для врача 1: {len(doctor_appointments)}")
    
    # Выводим структуру данных
    if doctor_appointments:
        print("\n📋 Структура данных записей:")
        print(f"Тип данных: {type(doctor_appointments)}")
        if isinstance(doctor_appointments, list):
            print(f"Количество записей: {len(doctor_appointments)}")
            
            # Показываем все записи с датами
            print("\n📅 Все записи:")
            for i, appointment in enumerate(doctor_appointments):
                print(f"  {i+1}. {appointment.get('patient_name', 'N/A')} - {appointment.get('appointment_datetime')}")
            
            # Показываем детали первых 3
            print("\n📋 Детали первых 3 записей:")
            for i, appointment in enumerate(doctor_appointments[:3]):
                print(f"Запись {i+1}:")
                print(f"  Тип: {type(appointment)}")
                print(f"  ID: {appointment.get('id')}")
                print(f"  Пациент: {appointment.get('patient_name', 'N/A')}")
                print(f"  Врач ID: {appointment.get('doctor_id')}")
                print(f"  Дата/время: {appointment.get('appointment_datetime')}")
                print(f"  Статус: {appointment.get('status')}")
                print()
        else:
            print(f"Данные не являются списком: {doctor_appointments}")
    else:
        print("❌ Нет записей для отображения")

if __name__ == "__main__":
    main()
