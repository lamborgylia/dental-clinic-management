#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001"

def login():
    """Логин в систему"""
    login_data = {
        "username": "+77770000000",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def test_cross_clinic_binding(token):
    """Тестируем привязывание пациента к другой клинике"""
    if not token:
        print("Нет токена для тестирования")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Получаем список пациентов
    patients_response = requests.get(f"{BASE_URL}/patients/", headers=headers)
    if patients_response.status_code != 200:
        print("Не удалось получить список пациентов")
        return
    
    patients = patients_response.json().get("patients", [])
    if not patients:
        print("Нет пациентов для тестирования")
        return
    
    # Выбираем пациента Иванова (ID: 1)
    test_patient = next((p for p in patients if p['id'] == 1), None)
    if not test_patient:
        print("Пациент Иванов не найден")
        return
    
    print(f"Тестируем с пациентом: {test_patient['full_name']} (ID: {test_patient['id']})")
    
    # Получаем врача клиники 2 (Федор, ID: 6)
    doctors_response = requests.get(f"{BASE_URL}/users/", headers=headers)
    if doctors_response.status_code != 200:
        print("Не удалось получить список врачей")
        return
    
    doctors = doctors_response.json()
    doctor_clinic_2 = next((d for d in doctors if d.get("id") == 6), None)
    
    if not doctor_clinic_2:
        print("Врач Федор (клиника 2) не найден")
        return
    
    print(f"Тестируем с врачом: {doctor_clinic_2['full_name']} (ID: {doctor_clinic_2['id']}, Клиника: {doctor_clinic_2['clinic_id']})")
    
    # Проверяем текущие связи пациента с клиниками
    clinic_patients_response = requests.get(f"{BASE_URL}/clinic-patients/", headers=headers)
    if clinic_patients_response.status_code == 200:
        clinic_patients = clinic_patients_response.json()
        patient_clinics = [cp for cp in clinic_patients if cp['patient_id'] == test_patient['id']]
        print(f"Текущие связи пациента с клиниками: {len(patient_clinics)}")
        for cp in patient_clinics:
            print(f"  - Клиника {cp['clinic_id']}: {cp['clinic_name']}")
    
    # Создаем запись с врачом из клиники 2
    tomorrow = datetime.now() + timedelta(days=1)
    appointment_data = {
        "patient_id": test_patient['id'],
        "doctor_id": doctor_clinic_2['id'],  # Врач из клиники 2
        "registrar_id": 8,  # ID тестового админа
        "appointment_datetime": tomorrow.isoformat(),
        "status": "scheduled",
        "service_type": "Консультация",
        "notes": "Тестовая запись для проверки привязывания к клинике 2"
    }
    
    print(f"\nСоздаем запись с врачом из клиники 2 на {tomorrow.strftime('%d.%m.%Y %H:%M')}")
    appointment_response = requests.post(f"{BASE_URL}/appointments/", json=appointment_data, headers=headers)
    
    if appointment_response.status_code == 200:
        appointment = appointment_response.json()
        print(f"✅ Запись создана (ID: {appointment['id']})")
        
        # Проверяем, появилась ли новая связь пациент-клиника
        clinic_patients_response = requests.get(f"{BASE_URL}/clinic-patients/", headers=headers)
        if clinic_patients_response.status_code == 200:
            clinic_patients = clinic_patients_response.json()
            patient_clinics = [cp for cp in clinic_patients if cp['patient_id'] == test_patient['id']]
            print(f"Связи пациента с клиниками после создания записи: {len(patient_clinics)}")
            for cp in patient_clinics:
                print(f"  - Клиника {cp['clinic_id']}: {cp['clinic_name']} (первое посещение: {cp['first_visit_date']})")
        
        # Завершаем запись
        print(f"\nЗавершаем запись {appointment['id']}")
        update_data = {"status": "completed"}
        update_response = requests.put(f"{BASE_URL}/appointments/{appointment['id']}", json=update_data, headers=headers)
        
        if update_response.status_code == 200:
            print("✅ Запись завершена")
            
            # Проверяем обновление last_visit_date
            clinic_patients_response = requests.get(f"{BASE_URL}/clinic-patients/", headers=headers)
            if clinic_patients_response.status_code == 200:
                clinic_patients = clinic_patients_response.json()
                patient_clinics = [cp for cp in clinic_patients if cp['patient_id'] == test_patient['id']]
                for cp in patient_clinics:
                    if cp['clinic_id'] == doctor_clinic_2['clinic_id']:
                        print(f"Последнее посещение в клинике 2: {cp['last_visit_date']}")
        else:
            print(f"❌ Ошибка завершения записи: {update_response.text}")
    else:
        print(f"❌ Ошибка создания записи: {appointment_response.text}")

def main():
    print("Тестирование привязывания пациента к клинике 2")
    token = login()
    test_cross_clinic_binding(token)

if __name__ == "__main__":
    main()
