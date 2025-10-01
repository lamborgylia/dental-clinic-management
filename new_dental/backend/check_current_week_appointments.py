#!/usr/bin/env python3
"""
Скрипт для проверки записей на текущую неделю
"""

import requests
import json
from datetime import datetime, timedelta

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
APPOINTMENTS_URL = f"{BASE_URL}/appointments/"
USERS_URL = f"{BASE_URL}/users/"

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

def get_doctors(token):
    """Получение списка врачей"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(USERS_URL, headers=headers)
        if response.status_code == 200:
            users = response.json()
            doctors = [user for user in users if user.get('role') == 'doctor']
            return doctors
        else:
            print(f"❌ Ошибка получения врачей: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения врачей: {e}")
        return []

def get_appointments_for_doctor(token, doctor_id):
    """Получение записей для конкретного врача"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(APPOINTMENTS_URL, headers=headers, params={"doctor_id": doctor_id})
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка получения записей для врача {doctor_id}: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения записей для врача {doctor_id}: {e}")
        return []

def main():
    print("🔍 Проверяем записи на текущую неделю...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Определяем текущую неделю
    today_2025 = datetime.now().replace(year=2025)
    start_of_week = today_2025 - timedelta(days=today_2025.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    print(f"📅 Текущая неделя: {start_of_week.strftime('%d.%m.%Y')} - {end_of_week.strftime('%d.%m.%Y')}")
    
    # Получаем врачей
    doctors = get_doctors(token)
    print(f"📊 Найдено врачей: {len(doctors)}")
    
    total_current_week = 0
    
    for doctor in doctors:
        doctor_id = doctor['id']
        doctor_name = doctor['full_name']
        
        appointments = get_appointments_for_doctor(token, doctor_id)
        
        # Фильтруем записи на текущую неделю
        current_week_appointments = []
        for apt in appointments:
            apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
            if start_of_week.date() <= apt_date.date() <= end_of_week.date():
                current_week_appointments.append(apt)
        
        print(f"\n👨‍⚕️ Врач {doctor_id} ({doctor_name}):")
        print(f"  📊 Всего записей: {len(appointments)}")
        print(f"  📅 На текущую неделю: {len(current_week_appointments)}")
        
        if current_week_appointments:
            print(f"  📋 Первые 5 записей на неделю:")
            for i, apt in enumerate(current_week_appointments[:5]):
                apt_date = datetime.fromisoformat(apt['appointment_datetime'].replace('Z', '+00:00'))
                print(f"    {i+1}. {apt.get('patient_name', 'N/A')} - {apt_date.strftime('%d.%m.%Y %H:%M')}")
        
        total_current_week += len(current_week_appointments)
    
    print(f"\n🎯 Итого записей на текущую неделю: {total_current_week}")

if __name__ == "__main__":
    main()

