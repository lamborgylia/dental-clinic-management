#!/usr/bin/env python3
"""
Скрипт для создания пользователей всех ролей
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.clinic import Clinic
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

def create_clinic(db: Session, name: str, address: str, contacts: str) -> Clinic:
    """Создает клинику"""
    clinic = Clinic(
        name=name,
        address=address,
        contacts=contacts
    )
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic

def create_user(db: Session, full_name: str, phone: str, password: str, role: UserRole, clinic_id: int = None) -> User:
    """Создает пользователя"""
    user = User(
        full_name=full_name,
        phone=phone,
        password_hash=get_password_hash(password),
        role=role,
        clinic_id=clinic_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def main():
    db = next(get_db())
    
    print("🏥 Создание клиники...")
    clinic = create_clinic(
        db=db,
        name="Стоматологическая клиника 'Улыбка'",
        address="ул. Абая, 150, Алматы",
        contacts="+7 (727) 123-45-67"
    )
    print(f"✅ Клиника создана: {clinic.name} (ID: {clinic.id})")
    
    print("\n👥 Создание пользователей всех ролей...")
    
    # Суперпользователь (админ)
    admin = create_user(
        db=db,
        full_name="Системный Администратор",
        phone="+77771234567",
        password="1234",
        role=UserRole.ADMIN
    )
    print(f"✅ Админ создан: {admin.full_name} ({admin.phone})")
    
    # Врач
    doctor = create_user(
        db=db,
        full_name="Доктор Ахметов Алихан",
        phone="+77771234568",
        password="1234",
        role=UserRole.DOCTOR,
        clinic_id=clinic.id
    )
    print(f"✅ Врач создан: {doctor.full_name} ({doctor.phone})")
    
    # Медсестра
    nurse = create_user(
        db=db,
        full_name="Медсестра Байжанова Айгуль",
        phone="+77771234569",
        password="1234",
        role=UserRole.NURSE,
        clinic_id=clinic.id
    )
    print(f"✅ Медсестра создана: {nurse.full_name} ({nurse.phone})")
    
    # Регистратор
    registrar = create_user(
        db=db,
        full_name="Регистратор Калиева Дария",
        phone="+77771234570",
        password="1234",
        role=UserRole.REGISTRAR,
        clinic_id=clinic.id
    )
    print(f"✅ Регистратор создан: {registrar.full_name} ({registrar.phone})")
    
    # Пациент
    patient_user = create_user(
        db=db,
        full_name="Пациент Смагулов Ерлан",
        phone="+77771234571",
        password="1234",
        role=UserRole.PATIENT
    )
    print(f"✅ Пациент создан: {patient_user.full_name} ({patient_user.phone})")
    
    print("\n🎉 Все пользователи созданы успешно!")
    print("\n📋 Данные для входа:")
    print("=" * 50)
    print("👑 АДМИН:")
    print(f"   Телефон: {admin.phone}")
    print(f"   Пароль: 1234")
    print(f"   Роль: {admin.role}")
    print()
    print("👨‍⚕️ ВРАЧ:")
    print(f"   Телефон: {doctor.phone}")
    print(f"   Пароль: 1234")
    print(f"   Роль: {doctor.role}")
    print()
    print("👩‍⚕️ МЕДСЕСТРА:")
    print(f"   Телефон: {nurse.phone}")
    print(f"   Пароль: 1234")
    print(f"   Роль: {nurse.role}")
    print()
    print("📝 РЕГИСТРАТОР:")
    print(f"   Телефон: {registrar.phone}")
    print(f"   Пароль: 1234")
    print(f"   Роль: {registrar.role}")
    print()
    print("👤 ПАЦИЕНТ:")
    print(f"   Телефон: {patient_user.phone}")
    print(f"   Пароль: 1234")
    print(f"   Роль: {patient_user.role}")
    print("=" * 50)

if __name__ == "__main__":
    main()
