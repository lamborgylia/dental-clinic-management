#!/usr/bin/env python3
"""
Скрипт для проверки врача с ID=1
"""

import requests
import json

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

def main():
    print("🔍 Проверяем врача с ID=1...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем всех пользователей
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(USERS_URL, headers=headers)
    users = response.json()
    
    print(f"📊 Всего пользователей: {len(users)}")
    
    # Ищем пользователя с ID=1
    user_1 = None
    for user in users:
        if user['id'] == 1:
            user_1 = user
            break
    
    if user_1:
        print(f"👤 Пользователь с ID=1: {user_1['full_name']} (роль: {user_1['role']})")
        
        # Проверяем записи для этого пользователя
        appointments_response = requests.get(APPOINTMENTS_URL, headers=headers, params={"doctor_id": 1})
        appointments = appointments_response.json()
        
        print(f"📅 Записей для пользователя ID=1: {len(appointments)}")
        
        if appointments:
            print("📋 Первые 5 записей:")
            for i, apt in enumerate(appointments[:5]):
                print(f"  {i+1}. {apt.get('patient_name', 'N/A')} - {apt.get('appointment_datetime')}")
    else:
        print("❌ Пользователь с ID=1 не найден")
    
    # Показываем всех врачей
    print(f"\n👨‍⚕️ Все врачи:")
    doctors = [user for user in users if user.get('role') == 'doctor']
    for doctor in doctors:
        print(f"  ID {doctor['id']}: {doctor['full_name']}")

if __name__ == "__main__":
    main()

