#!/usr/bin/env python3
"""
Скрипт для отладки API пациентов
"""

import requests
import json

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
PATIENTS_URL = f"{BASE_URL}/patients/"

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

def get_patients_detailed(token, page=1, size=100):
    """Получение списка пациентов с детальной информацией"""
    headers = {"Authorization": f"Bearer {token}"}
    params = {"page": page, "size": size}
    
    try:
        print(f"🔍 Запрашиваем пациентов: page={page}, size={size}")
        response = requests.get(PATIENTS_URL, headers=headers, params=params)
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Структура ответа: {list(data.keys())}")
            print(f"📊 Общее количество пациентов: {data.get('total', 'N/A')}")
            print(f"📊 Пациентов на странице: {len(data.get('patients', []))}")
            
            patients = data.get('patients', [])
            print(f"\n📋 Первые 5 пациентов:")
            for i, patient in enumerate(patients[:5]):
                print(f"  {i+1}. {patient.get('full_name', 'N/A')} - {patient.get('phone', 'N/A')}")
            
            return patients
        else:
            print(f"❌ Ошибка получения пациентов: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения пациентов: {e}")
        return []

def main():
    print("🔍 Отладка API пациентов...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем пациентов с разными параметрами
    print("\n=== Тест 1: Без параметров ===")
    patients1 = get_patients_detailed(token)
    
    print("\n=== Тест 2: page=1, size=100 ===")
    patients2 = get_patients_detailed(token, page=1, size=100)
    
    print("\n=== Тест 3: page=1, size=10 ===")
    patients3 = get_patients_detailed(token, page=1, size=10)
    
    print("\n=== Тест 4: page=2, size=10 ===")
    patients4 = get_patients_detailed(token, page=2, size=10)

if __name__ == "__main__":
    main()

