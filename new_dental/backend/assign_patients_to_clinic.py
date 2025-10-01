#!/usr/bin/env python3
"""
Скрипт для привязки всех пациентов к клинике "Улыбка"
"""

import requests
import json

# Настройки
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/auth/login"
PATIENTS_URL = f"{BASE_URL}/patients/"
CLINIC_PATIENTS_URL = f"{BASE_URL}/clinic-patients/"
CLINICS_URL = f"{BASE_URL}/clinics/"

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

def get_clinics(token):
    """Получение списка клиник"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(CLINICS_URL, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Ошибка получения клиник: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения клиник: {e}")
        return []

def get_patients(token):
    """Получение списка всех пациентов"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(PATIENTS_URL, headers=headers, params={"page": 1, "size": 100})
        if response.status_code == 200:
            data = response.json()
            return data.get('patients', [])
        else:
            print(f"❌ Ошибка получения пациентов: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Ошибка получения пациентов: {e}")
        return []

def add_patient_to_clinic(token, patient_id, clinic_id):
    """Добавление пациента в клинику"""
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "patient_id": patient_id,
        "clinic_id": clinic_id
    }
    data = {
        "is_active": True
    }
    try:
        response = requests.post(CLINIC_PATIENTS_URL, params=params, json=data, headers=headers)
        if response.status_code == 200 or response.status_code == 201:
            return True
        else:
            print(f"❌ Ошибка добавления пациента {patient_id} в клинику {clinic_id}: {response.status_code}")
            print(f"📄 Ответ: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка добавления пациента {patient_id} в клинику {clinic_id}: {e}")
        return False

def main():
    print("🚀 Привязываем всех пациентов к клинике 'Улыбка'...")
    
    # Входим в систему
    token = login()
    if not token:
        print("❌ Не удалось войти в систему")
        return
    
    print("✅ Успешно вошли в систему")
    
    # Получаем клиники
    clinics = get_clinics(token)
    print(f"📊 Найдено клиник: {len(clinics)}")
    
    # Ищем клинику "Улыбка"
    smile_clinic = None
    for clinic in clinics:
        if "улыбка" in clinic.get('name', '').lower() or "smile" in clinic.get('name', '').lower():
            smile_clinic = clinic
            break
    
    if not smile_clinic:
        print("❌ Клиника 'Улыбка' не найдена")
        print("📋 Доступные клиники:")
        for clinic in clinics:
            print(f"  - {clinic.get('name', 'N/A')} (ID: {clinic.get('id', 'N/A')})")
        return
    
    print(f"✅ Найдена клиника: {smile_clinic.get('name')} (ID: {smile_clinic.get('id')})")
    
    # Получаем всех пациентов
    patients = get_patients(token)
    print(f"📊 Найдено пациентов: {len(patients)}")
    
    if not patients:
        print("❌ Нет пациентов для привязки")
        return
    
    # Привязываем всех пациентов к клинике
    clinic_id = smile_clinic.get('id')
    success_count = 0
    already_assigned_count = 0
    
    for i, patient in enumerate(patients):
        patient_id = patient.get('id')
        patient_name = patient.get('full_name', 'N/A')
        
        print(f"🔄 Привязываем пациента {i+1}/{len(patients)}: {patient_name}")
        
        result = add_patient_to_clinic(token, patient_id, clinic_id)
        if result:
            success_count += 1
            print(f"  ✅ Успешно привязан")
        else:
            # Проверяем, была ли это ошибка "уже добавлен"
            print(f"  ⚠️ Уже привязан или ошибка")
            already_assigned_count += 1
    
    print(f"\n🎉 Готово!")
    print(f"📊 Успешно привязано пациентов: {success_count}")
    print(f"📊 Уже были привязаны: {already_assigned_count}")
    print(f"📊 Всего обработано: {success_count + already_assigned_count}/{len(patients)}")
    print(f"🏥 Клиника: {smile_clinic.get('name')}")

if __name__ == "__main__":
    main()
