#!/usr/bin/env python3
"""
Скрипт для создания недостающих пользователей
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.clinic import Clinic
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

def get_or_create_clinic(db: Session) -> Clinic:
    """Получает существующую клинику или создает новую"""
    clinic = db.query(Clinic).first()
    if not clinic:
        clinic = Clinic(
            name="Стоматологическая клиника 'Улыбка'",
            address="ул. Абая, 150, Алматы",
            contacts="+7 (727) 123-45-67"
        )
        db.add(clinic)
        db.commit()
        db.refresh(clinic)
        print(f"✅ Клиника создана: {clinic.name} (ID: {clinic.id})")
    else:
        print(f"✅ Клиника найдена: {clinic.name} (ID: {clinic.id})")
    return clinic

def get_or_create_user(db: Session, full_name: str, phone: str, password: str, role: UserRole, clinic_id: int = None) -> User:
    """Получает существующего пользователя или создает нового"""
    user = db.query(User).filter(User.phone == phone).first()
    if user:
        print(f"✅ Пользователь уже существует: {user.full_name} ({user.phone}) - {user.role}")
        return user
    
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
    print(f"✅ Пользователь создан: {user.full_name} ({user.phone}) - {user.role}")
    return user

def main():
    db = next(get_db())
    
    print("🏥 Проверка клиники...")
    clinic = get_or_create_clinic(db)
    
    print("\n👥 Создание недостающих пользователей...")
    
    # Список пользователей для создания
    users_to_create = [
        {
            "full_name": "Системный Администратор",
            "phone": "+77771234567",
            "password": "1234",
            "role": UserRole.ADMIN,
            "clinic_id": None
        },
        {
            "full_name": "Доктор Ахметов Алихан",
            "phone": "+77771234568",
            "password": "1234",
            "role": UserRole.DOCTOR,
            "clinic_id": clinic.id
        },
        {
            "full_name": "Медсестра Байжанова Айгуль",
            "phone": "+77771234569",
            "password": "1234",
            "role": UserRole.NURSE,
            "clinic_id": clinic.id
        },
        {
            "full_name": "Регистратор Калиева Дария",
            "phone": "+77771234570",
            "password": "1234",
            "role": UserRole.REGISTRAR,
            "clinic_id": clinic.id
        },
        {
            "full_name": "Пациент Смагулов Ерлан",
            "phone": "+77771234571",
            "password": "1234",
            "role": UserRole.PATIENT,
            "clinic_id": None
        }
    ]
    
    created_users = []
    for user_data in users_to_create:
        user = get_or_create_user(db, **user_data)
        created_users.append(user)
    
    print("\n🎉 Все пользователи готовы!")
    print("\n📋 Данные для входа:")
    print("=" * 50)
    
    for user in created_users:
        role_emoji = {
            UserRole.ADMIN: "👑",
            UserRole.DOCTOR: "👨‍⚕️",
            UserRole.NURSE: "👩‍⚕️",
            UserRole.REGISTRAR: "📝",
            UserRole.PATIENT: "👤"
        }.get(user.role, "👤")
        
        print(f"{role_emoji} {user.role.upper()}:")
        print(f"   Телефон: {user.phone}")
        print(f"   Пароль: 1234")
        print(f"   Имя: {user.full_name}")
        print()
    
    print("=" * 50)

if __name__ == "__main__":
    main()
