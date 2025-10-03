#!/usr/bin/env python3
"""
Скрипт для тестирования API деплоя
"""

import requests
import json

def test_deploy_api():
    """Тестирует API деплоя"""
    
    # Замени на реальный URL твоего бэкенда
    BASE_URL = "https://your-backend-url.onrender.com"
    
    print("🚀 Тестирование API деплоя...")
    print(f"📡 URL: {BASE_URL}")
    
    try:
        # 1. Проверяем доступность API
        print("\n1️⃣ Проверка доступности API...")
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API доступен!")
        else:
            print("❌ API недоступен")
            return False
        
        # 2. Получаем токен администратора
        print("\n2️⃣ Получение токена администратора...")
        login_data = {
            "phone": "+77771234567",
            "password": "admin123"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Токен получен!")
        else:
            print("❌ Ошибка входа")
            print(f"Ответ: {response.text}")
            return False
        
        # 3. Запускаем деплой
        print("\n3️⃣ Запуск деплоя базы данных...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(f"{BASE_URL}/deploy/deploy-database", headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("🎉 Деплой успешен!")
            print(f"📊 Создано:")
            print(f"  🏥 Клиник: {result['created']['clinics']}")
            print(f"  👥 Пользователей: {result['created']['users']}")
            print(f"  🦷 Услуг: {result['created']['services']}")
            print(f"  👤 Пациентов: {result['created']['patients']}")
            print(f"  📅 Записей: {result['created']['appointments']}")
            
            print(f"\n🔑 Данные для входа:")
            for role, creds in result['login_credentials'].items():
                print(f"  {role}: {creds}")
            
            return True
        else:
            print("❌ Ошибка деплоя")
            print(f"Ответ: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🚀 ТЕСТИРОВАНИЕ API ДЕПЛОЯ")
    print("=" * 50)
    
    success = test_deploy_api()
    if success:
        print("\n✅ ТЕСТ ПРОЙДЕН!")
    else:
        print("\n💥 ТЕСТ НЕ ПРОЙДЕН!")
