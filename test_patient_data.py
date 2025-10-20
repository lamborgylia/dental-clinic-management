#!/usr/bin/env python3
"""
Тест для проверки сохранения данных пациента в плане лечения
"""

import requests
import json

def test_treatment_plan_patient_data():
    """Тестирует сохранение и загрузку данных пациента в плане лечения"""
    
    base_url = "http://localhost:8001"
    
    # Попробуем разные комбинации логинов
    login_attempts = [
        {"username": "+77771234567", "password": "admin123"},
        {"username": "+77771234568", "password": "password"},
        {"username": "+77771234568", "password": "doctor123"},
        {"username": "+77771234567", "password": "password"},
    ]
    
    token = None
    for attempt in login_attempts:
        try:
            response = requests.post(
                f"{base_url}/auth/login",
                data=attempt,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    token = data['access_token']
                    print(f"✅ Авторизация успешна с {attempt['username']}")
                    break
        except Exception as e:
            print(f"❌ Ошибка при авторизации с {attempt['username']}: {e}")
    
    if not token:
        print("❌ Не удалось авторизоваться")
        return
    
    # Теперь проверим план лечения
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Получаем план лечения
        response = requests.get(f"{base_url}/treatment-plans/1", headers=headers)
        
        if response.status_code == 200:
            plan_data = response.json()
            print("✅ План лечения получен:")
            print(f"  - ID: {plan_data.get('id')}")
            print(f"  - Пациент: {plan_data.get('patient_name', 'Не указан')}")
            print(f"  - Аллергии: {plan_data.get('patient_allergies', 'Не указано')}")
            print(f"  - Хронические заболевания: {plan_data.get('patient_chronic_diseases', 'Не указано')}")
            print(f"  - Противопоказания: {plan_data.get('patient_contraindications', 'Не указано')}")
            print(f"  - Особые отметки: {plan_data.get('patient_special_notes', 'Не указано')}")
            print(f"  - Вылеченные зубы: {plan_data.get('treated_teeth', [])}")
            
            # Теперь попробуем обновить данные пациента
            update_data = {
                "patient_allergies": "Тестовая аллергия на пенициллин",
                "patient_chronic_diseases": "Тестовое хроническое заболевание",
                "patient_contraindications": "Тестовые противопоказания",
                "patient_special_notes": "Тестовые особые отметки",
                "treated_teeth": [11, 12]
            }
            
            response = requests.put(
                f"{base_url}/treatment-plans/1", 
                json=update_data, 
                headers=headers
            )
            
            if response.status_code == 200:
                updated_plan = response.json()
                print("\n✅ План лечения обновлен:")
                print(f"  - Аллергии: {updated_plan.get('patient_allergies', 'Не указано')}")
                print(f"  - Хронические заболевания: {updated_plan.get('patient_chronic_diseases', 'Не указано')}")
                print(f"  - Противопоказания: {updated_plan.get('patient_contraindications', 'Не указано')}")
                print(f"  - Особые отметки: {updated_plan.get('patient_special_notes', 'Не указано')}")
                print(f"  - Вылеченные зубы: {updated_plan.get('treated_teeth', [])}")
                
                # Проверим, что данные сохранились
                response = requests.get(f"{base_url}/treatment-plans/1", headers=headers)
                if response.status_code == 200:
                    saved_plan = response.json()
                    print("\n✅ Данные сохранились в БД:")
                    print(f"  - Аллергии: {saved_plan.get('patient_allergies', 'Не указано')}")
                    print(f"  - Хронические заболевания: {saved_plan.get('patient_chronic_diseases', 'Не указано')}")
                    print(f"  - Противопоказания: {saved_plan.get('patient_contraindications', 'Не указано')}")
                    print(f"  - Особые отметки: {saved_plan.get('patient_special_notes', 'Не указано')}")
                    print(f"  - Вылеченные зубы: {saved_plan.get('treated_teeth', [])}")
                else:
                    print(f"❌ Ошибка при повторной загрузке плана: {response.status_code}")
            else:
                print(f"❌ Ошибка при обновлении плана: {response.status_code}")
                print(f"Ответ: {response.text}")
        else:
            print(f"❌ Ошибка при получении плана лечения: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")

if __name__ == "__main__":
    test_treatment_plan_patient_data()
