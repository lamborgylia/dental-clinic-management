#!/usr/bin/env python3
"""
Скрипт для добавления поля treated_teeth через API
"""

import requests
import json

def add_treated_teeth_via_api():
    """Добавляет поле treated_teeth через API endpoint"""
    
    base_url = "http://localhost:8001"
    
    # Авторизуемся
    login_data = {
        "username": "+77770000000",
        "password": "test123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("✅ Авторизация успешна")
            
            # Создаем endpoint для миграции (если его нет)
            headers = {"Authorization": f"Bearer {token}"}
            
            # Выполняем миграцию через новый endpoint
            try:
                response = requests.post(
                    f"{base_url}/migrate/add-treated-teeth",
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Миграция выполнена: {result['message']}")
                    print(f"Статус: {result['status']}")
                else:
                    print(f"❌ Ошибка при выполнении миграции: {response.status_code}")
                    print(f"Ответ: {response.text}")
                    
            except Exception as e:
                print(f"❌ Ошибка при выполнении миграции: {e}")
        else:
            print(f"❌ Ошибка авторизации: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при подключении к API: {e}")

if __name__ == "__main__":
    add_treated_teeth_via_api()
