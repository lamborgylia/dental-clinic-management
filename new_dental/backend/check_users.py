#!/usr/bin/env python3
"""
Проверяем пользователей в системе
"""

import requests
import json

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"

def test_login(username, password):
    """Тестируем вход с разными данными"""
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(LOGIN_URL, data=login_data)
        print(f"🔐 {username}/{password}: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Успешный вход!")
            return response.json().get("access_token")
        else:
            print(f"   ❌ Ошибка: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Исключение: {e}")
        return None

def main():
    print("🔍 Проверяем доступных пользователей...")
    
    # Тестируем разные комбинации
    test_cases = [
        ("+77771234567", "admin123"),
        ("+77771234567", "admin"),
        ("+77771234567", "password"),
        ("+77771234567", "123456"),
        ("+77771234568", "doctor123"),
        ("+77771234568", "doctor"),
        ("+7776666666", "fedor123"),
        ("+7776666666", "fedor"),
    ]
    
    for username, password in test_cases:
        token = test_login(username, password)
        if token:
            print(f"🎉 Найден рабочий пользователь: {username}/{password}")
            break

if __name__ == "__main__":
    main()
