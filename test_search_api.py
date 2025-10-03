#!/usr/bin/env python3

import requests
import json

# Тестируем API поиска пациентов
BASE_URL = "http://localhost:8001"

def test_clinic_patients_search():
    """Тестируем поиск пациентов в клинике"""
    
    # Сначала логинимся как админ
    login_data = {
        "phone": "+77770000000",
        "password": "test123"
    }
    
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
    
    # Тестируем поиск пациентов
    print("\n🔍 Тестируем поиск пациентов...")
    
    # Сначала получаем всех пациентов
    patients_response = requests.get(f"{BASE_URL}/clinic-patients/", headers=headers)
    print(f"📋 Статус получения пациентов: {patients_response.status_code}")
    
    if patients_response.status_code == 200:
        patients_data = patients_response.json()
        print(f"📊 Найдено пациентов: {len(patients_data)}")
        
        if patients_data:
            first_patient = patients_data[0]
            print(f"👤 Первый пациент: {first_patient.get('patient_name', 'Неизвестно')}")
            
            # Тестируем поиск по имени первого пациента
            search_name = first_patient.get('patient_name', '').split()[0] if first_patient.get('patient_name') else 'test'
            print(f"\n🔍 Ищем по имени: '{search_name}'")
            
            search_response = requests.get(
                f"{BASE_URL}/clinic-patients/", 
                headers=headers,
                params={"search": search_name}
            )
            
            print(f"📋 Статус поиска: {search_response.status_code}")
            
            if search_response.status_code == 200:
                search_results = search_response.json()
                print(f"🎯 Найдено результатов: {len(search_results)}")
                
                for i, result in enumerate(search_results[:3]):  # Показываем первые 3
                    print(f"  {i+1}. {result.get('patient_name', 'Неизвестно')} - {result.get('patient_phone', 'Нет телефона')}")
            else:
                print(f"❌ Ошибка поиска: {search_response.text}")
        else:
            print("⚠️ Нет пациентов для тестирования")
    else:
        print(f"❌ Ошибка получения пациентов: {patients_response.text}")

if __name__ == "__main__":
    test_clinic_patients_search()
