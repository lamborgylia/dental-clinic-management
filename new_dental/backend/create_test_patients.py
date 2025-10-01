#!/usr/bin/env python3
"""
Скрипт для создания тестовых данных пациентов
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import date
from app.core.database import SessionLocal
from app.models.patient import Patient

def create_test_patients():
    """Создает тестовых пациентов"""
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже пациенты
        existing_count = db.query(Patient).count()
        if existing_count > 0:
            print(f"📊 В базе уже есть {existing_count} пациентов")
            return True
        
        # Создаем тестовых пациентов
        test_patients = [
            Patient(
                full_name="Иванов Иван Иванович",
                phone="+7 (777) 123-45-67",
                iin="030317123456",
                birth_date=date(2003, 3, 17),
                allergies="Аллергия на пенициллин, лидокаин",
                chronic_diseases="Сахарный диабет 2 типа",
                contraindications="Не рекомендуется лечение под общим наркозом",
                special_notes="Пациентка беременна, 3-й триместр"
            ),
            Patient(
                full_name="Петрова Анна Сергеевна",
                phone="+7 (777) 987-65-43",
                iin="950512789012",
                birth_date=date(1995, 5, 12),
                allergies="Нет аллергий",
                chronic_diseases="Гипертония",
                contraindications="Ограничения по физической нагрузке",
                special_notes="Пациентка работает в ночную смену"
            ),
            Patient(
                full_name="Сидоров Петр Александрович",
                phone="+7 (777) 555-12-34",
                iin="880825345678",
                birth_date=date(1988, 8, 25),
                allergies="Аллергия на аспирин",
                chronic_diseases="Бронхиальная астма",
                contraindications="Избегать стрессовых ситуаций",
                special_notes="Пациент курит, рекомендуется бросить"
            ),
            Patient(
                full_name="Козлова Мария Владимировна",
                phone="+7 (777) 444-56-78",
                iin="920103456789",
                birth_date=date(1992, 1, 3),
                allergies="Нет аллергий",
                chronic_diseases="Нет хронических заболеваний",
                contraindications="Нет противопоказаний",
                special_notes="Спортсменка, регулярно занимается спортом"
            ),
            Patient(
                full_name="Новиков Дмитрий Игоревич",
                phone="+7 (777) 333-22-11",
                iin="750609123456",
                birth_date=date(1975, 6, 9),
                allergies="Аллергия на металлы",
                chronic_diseases="Гастрит",
                contraindications="Ограничения в питании",
                special_notes="Пациент работает водителем, важно учитывать при назначении лекарств"
            )
        ]
        
        for patient in test_patients:
            db.add(patient)
        
        db.commit()
        print(f"✅ Создано {len(test_patients)} тестовых пациентов")
        
        # Показываем созданных пациентов
        patients = db.query(Patient).all()
        print("\n📋 Созданные пациенты:")
        for patient in patients:
            print(f"  - {patient.full_name} (ИИН: {patient.iin}, Телефон: {patient.phone})")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при создании тестовых пациентов: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Создание тестовых пациентов...")
    success = create_test_patients()
    if success:
        print("🎉 Готово!")
    else:
        print("💥 Произошла ошибка!")
        sys.exit(1)
