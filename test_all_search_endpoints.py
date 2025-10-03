#!/usr/bin/env python3

import requests
import json

# Тестируем все API эндпоинты поиска
BASE_URL = "http://localhost:8001"

def test_all_search_endpoints():
    """Тестируем все эндпоинты поиска"""
    
    # Логинимся как админ
    print("🔐 Логинимся как админ...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login", 
        data={"username": "+77770000000", "password": "test123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Ошибка логина: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Успешно залогинились")
    
    # Тестируем все эндпоинты
    endpoints = [
        ("/clinic-patients/", "Поиск пациентов клиники"),
        ("/appointments/", "Поиск записей"),
        ("/treatment-plans/", "Поиск планов лечения"),
        ("/treatment-orders/", "Поиск нарядов")
    ]
    
    search_query = "Сидоров"
    
    for endpoint, description in endpoints:
        print(f"\n🔍 {description}")
        print(f"📡 Эндпоинт: {endpoint}")
        
        # Тестируем без параметров
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"📋 Без параметров: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"📊 Результатов: {len(data) if isinstance(data, list) else 'Не массив'}")
            else:
                print(f"❌ Ошибка: {response.text}")
        except Exception as e:
            print(f"❌ Исключение: {e}")
        
        # Тестируем с поиском
        try:
            params = {"search": search_query}
            if endpoint != "/clinic-patients/":
                params["clinic_id"] = 1
                
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
            print(f"🔍 С поиском '{search_query}': {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"🎯 Найдено: {len(data) if isinstance(data, list) else 'Не массив'}")
                if isinstance(data, list) and data:
                    print(f"📝 Первый результат: {data[0]}")
            else:
                print(f"❌ Ошибка: {response.text}")
        except Exception as e:
            print(f"❌ Исключение: {e}")

if __name__ == "__main__":
    test_all_search_endpoints()
