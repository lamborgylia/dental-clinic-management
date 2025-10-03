#!/usr/bin/env python3
"""
Тестовый скрипт для проверки авторизации
"""

import requests
import json

def test_auth():
    """Тестирует авторизацию"""
    
    print("🔧 ТЕСТ АВТОРИЗАЦИИ")
    print("=" * 50)
    
    # URL бэкенда
    base_url = "https://dental-clinic-management-bzsn.onrender.com"
    
    # Данные для входа
    login_data = {
        "grant_type": "password",
        "username": "+77771234567",
        "password": "admin123"
    }
    
    try:
        print("🔗 Подключение к бэкенду...")
        print(f"URL: {base_url}")
        
        # Тест health check
        print("\n1️⃣ Тест health check...")
        health_response = requests.get(f"{base_url}/health", timeout=10)
        print(f"Status: {health_response.status_code}")
        print(f"Response: {health_response.text}")
        
        # Тест авторизации
        print("\n2️⃣ Тест авторизации...")
        print(f"Login data: {login_data}")
        
        auth_response = requests.post(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"Status: {auth_response.status_code}")
        print(f"Headers: {dict(auth_response.headers)}")
        print(f"Response: {auth_response.text}")
        
        if auth_response.status_code == 200:
            print("✅ Авторизация успешна!")
            token_data = auth_response.json()
            print(f"Token: {token_data.get('access_token', 'N/A')[:20]}...")
            return True
        else:
            print("❌ Авторизация не удалась")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка запроса: {e}")
        return False
    except Exception as e:
        print(f"❌ Общая ошибка: {e}")
        return False

if __name__ == "__main__":
    test_auth()
