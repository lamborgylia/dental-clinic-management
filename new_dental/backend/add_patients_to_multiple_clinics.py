#!/usr/bin/env python3
import sys
sys.path.append('.')
from app.core.database import SessionLocal
from app.models.clinic_patient import ClinicPatient
from app.models.clinic import Clinic
from app.models.patient import Patient
from datetime import datetime, timedelta
import random

def add_patients_to_multiple_clinics():
    """Добавляем пациентов в разные клиники для демонстрации логики"""
    db = SessionLocal()
    try:
        # Получаем все клиники
        clinics = db.query(Clinic).all()
        print(f"Найдено клиник: {len(clinics)}")
        for clinic in clinics:
            print(f"  - ID: {clinic.id}, Название: {clinic.name}")
        
        # Получаем всех пациентов
        patients = db.query(Patient).all()
        print(f"\nНайдено пациентов: {len(patients)}")
        
        # Создаем вторую клинику если её нет
        if len(clinics) < 2:
            new_clinic = Clinic(
                name="Стоматология 'Белые зубы'",
                description="Современная стоматологическая клиника",
                address="г. Алматы, ул. Абая 200",
                contacts="+7 (727) 123-45-67",
                is_active=True
            )
            db.add(new_clinic)
            db.commit()
            db.refresh(new_clinic)
            clinics.append(new_clinic)
            print(f"Создана новая клиника: {new_clinic.name} (ID: {new_clinic.id})")
        
        # Добавляем случайных пациентов во вторую клинику
        clinic2 = clinics[0] if clinics[0].id != 1 else clinics[1]  # Берем клинику, которая не ID=1
        added_count = 0
        
        # Берем случайных 20 пациентов для второй клиники
        random_patients = random.sample(patients, min(20, len(patients)))
        
        for patient in random_patients:
            # Проверяем, не добавлен ли уже этот пациент в эту клинику
            existing = db.query(ClinicPatient).filter(
                ClinicPatient.clinic_id == clinic2.id,
                ClinicPatient.patient_id == patient.id
            ).first()
            
            if not existing:
                # Создаем связь пациент-клиника
                clinic_patient = ClinicPatient(
                    clinic_id=clinic2.id,
                    patient_id=patient.id,
                    first_visit_date=datetime.now() - timedelta(days=random.randint(1, 365)),
                    last_visit_date=datetime.now() - timedelta(days=random.randint(1, 30)) if random.choice([True, False]) else None,
                    is_active=True
                )
                db.add(clinic_patient)
                added_count += 1
        
        db.commit()
        print(f"\nДобавлено {added_count} пациентов в клинику '{clinic2.name}'")
        
        # Показываем статистику
        print("\nСтатистика по клиникам:")
        for clinic in clinics:
            count = db.query(ClinicPatient).filter(
                ClinicPatient.clinic_id == clinic.id,
                ClinicPatient.is_active == True
            ).count()
            print(f"  - {clinic.name}: {count} пациентов")
        
        # Показываем пациентов, которые есть в нескольких клиниках
        print("\nПациенты в нескольких клиниках:")
        for patient in patients[:10]:  # Показываем только первых 10
            clinic_count = db.query(ClinicPatient).filter(
                ClinicPatient.patient_id == patient.id,
                ClinicPatient.is_active == True
            ).count()
            if clinic_count > 1:
                clinic_names = []
                clinic_patients = db.query(ClinicPatient).filter(
                    ClinicPatient.patient_id == patient.id,
                    ClinicPatient.is_active == True
                ).all()
                for cp in clinic_patients:
                    clinic = db.query(Clinic).filter(Clinic.id == cp.clinic_id).first()
                    if clinic:
                        clinic_names.append(clinic.name)
                print(f"  - {patient.full_name}: {clinic_names}")
        
    finally:
        db.close()

if __name__ == "__main__":
    add_patients_to_multiple_clinics()
