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

def test_automatic_patient_clinic_binding(token):
    """Тестируем автоматическое привязывание пациента к клинике"""
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
    
    # Выбираем первого пациента
    test_patient = patients[0]
    print(f"Тестируем с пациентом: {test_patient['full_name']} (ID: {test_patient['id']})")
    
    # Получаем список врачей
    doctors_response = requests.get(f"{BASE_URL}/users/", headers=headers)
    if doctors_response.status_code != 200:
        print("Не удалось получить список врачей")
        return
    
    doctors = doctors_response.json()
    doctor = None
    for d in doctors:
        if d.get("role") == "doctor" and d.get("clinic_id"):
            doctor = d
            break
    
    if not doctor:
        print("Не найден врач для тестирования")
        return
    
    print(f"Тестируем с врачом: {doctor['full_name']} (ID: {doctor['id']}, Клиника: {doctor['clinic_id']})")
    
    # Проверяем текущие связи пациента с клиниками
    clinic_patients_response = requests.get(f"{BASE_URL}/clinic-patients/", headers=headers)
    if clinic_patients_response.status_code == 200:
        clinic_patients = clinic_patients_response.json()
        patient_clinics = [cp for cp in clinic_patients if cp['patient_id'] == test_patient['id']]
        print(f"Текущие связи пациента с клиниками: {len(patient_clinics)}")
        for cp in patient_clinics:
            print(f"  - Клиника {cp['clinic_id']}: {cp['clinic_name']}")
    
    # Создаем запись на завтра
    tomorrow = datetime.now() + timedelta(days=1)
    appointment_data = {
        "patient_id": test_patient['id'],
        "doctor_id": doctor['id'],
        "registrar_id": 8,  # ID тестового админа
        "appointment_datetime": tomorrow.isoformat(),
        "status": "scheduled",
        "service_type": "Консультация",
        "notes": "Тестовая запись для проверки автоматического привязывания"
    }
    
    print(f"\nСоздаем запись на {tomorrow.strftime('%d.%m.%Y %H:%M')}")
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
                    if cp['clinic_id'] == doctor['clinic_id']:
                        print(f"Последнее посещение обновлено: {cp['last_visit_date']}")
        else:
            print(f"❌ Ошибка завершения записи: {update_response.text}")
    else:
        print(f"❌ Ошибка создания записи: {appointment_response.text}")

def main():
    print("Тестирование автоматического привязывания пациента к клинике")
    token = login()
    test_automatic_patient_clinic_binding(token)

if __name__ == "__main__":
    main()
