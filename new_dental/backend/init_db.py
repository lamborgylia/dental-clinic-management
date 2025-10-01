#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных с тестовыми данными
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from app.models import Base, Clinic, User, UserRole
from app.core.security import get_password_hash

def init_db():
    """Инициализация базы данных"""
    print("🔄 Создание таблиц...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже клиника
        clinic = db.query(Clinic).first()
        if not clinic:
            print("🏥 Создание тестовой клиники...")
            clinic = Clinic(
                name="Стоматологическая клиника 'Улыбка'",
                description="Современная стоматологическая клиника с высококвалифицированными специалистами. Мы предлагаем полный спектр стоматологических услуг с использованием новейших технологий и материалов.",
                address="ул. Примерная, 123, г. Алматы",
                contacts="+7 (777) 123-45-67, info@smile.kz"
            )
            db.add(clinic)
            db.commit()
            db.refresh(clinic)
            print(f"✅ Клиника создана с ID: {clinic.id}")
        else:
            print(f"✅ Клиника уже существует с ID: {clinic.id}")
        
        # Проверяем, есть ли уже пользователи
        users = db.query(User).all()
        if not users:
            print("👥 Создание тестовых пользователей...")
            
            # Создаем админа
            admin = User(
                full_name="Администратор",
                phone="+77771234567",
                password_hash=get_password_hash("1234"),
                role=UserRole.ADMIN,
                clinic_id=clinic.id,
                is_active=True
            )
            db.add(admin)
            
            # Создаем врача
            doctor = User(
                full_name="Доктор Иванов",
                phone="+77771234568",
                password_hash=get_password_hash("1234"),
                role=UserRole.DOCTOR,
                clinic_id=clinic.id,
                is_active=True
            )
            db.add(doctor)
            
            # Создаем медсестру
            nurse = User(
                full_name="Медсестра Петрова",
                phone="+77771234569",
                password_hash=get_password_hash("1234"),
                role=UserRole.NURSE,
                clinic_id=clinic.id,
                is_active=True
            )
            db.add(nurse)
            
            # Создаем регистратора
            registrar = User(
                full_name="Регистратор Сидорова",
                phone="+77771234570",
                password_hash=get_password_hash("1234"),
                role=UserRole.REGISTRAR,
                clinic_id=clinic.id,
                is_active=True
            )
            db.add(registrar)
            
            # Создаем пациента
            patient = User(
                full_name="Пациент Козлов",
                phone="+77771234571",
                password_hash=get_password_hash("1234"),
                role=UserRole.PATIENT,
                clinic_id=clinic.id,
                is_active=True
            )
            db.add(patient)
            
            db.commit()
            print("✅ Тестовые пользователи созданы")
        else:
            print(f"✅ Пользователи уже существуют: {len(users)} пользователей")
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации БД: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Запуск инициализации базы данных...")
    init_db()
    print("✅ Инициализация завершена!")
