#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8001"

def login():
    """Логин в систему"""
    login_data = {
        "username": "+77770000000",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    print(f"Login response status: {response.status_code}")
    print(f"Login response: {response.text}")
    
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        # Попробуем с другим паролем
        login_data["password"] = "password"
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print(f"Login with 'password' status: {response.status_code}")
        print(f"Login with 'password' response: {response.text}")
        
        if response.status_code == 200:
            return response.json().get("access_token")
    
    return None

def test_clinic_patients_api(token):
    """Тестируем API клиник-пациентов"""
    if not token:
        print("Нет токена для тестирования")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Тестируем получение пациентов клиники
    response = requests.get(f"{BASE_URL}/clinic-patients/", headers=headers)
    print(f"\nClinic patients API status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Найдено {len(data)} пациентов в клинике")
        if data:
            print("Первый пациент:")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
    else:
        print(f"Ошибка: {response.text}")

def main():
    print("Тестирование API клиник-пациентов")
    token = login()
    test_clinic_patients_api(token)

if __name__ == "__main__":
    main()