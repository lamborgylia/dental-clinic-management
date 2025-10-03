#!/usr/bin/env python3
import sys
sys.path.append('.')
from app.core.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    """Создаем тестового пользователя с известным паролем"""
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже пользователь с таким телефоном
        existing_user = db.query(User).filter(User.phone == "+77770000000").first()
        if existing_user:
            print("Пользователь уже существует, обновляем пароль")
            existing_user.password_hash = pwd_context.hash("test123")
            db.commit()
            print("Пароль обновлен")
        else:
            # Создаем нового пользователя
            new_user = User(
                full_name="Тестовый Админ",
                phone="+77770000000",
                password_hash=pwd_context.hash("test123"),
                role="admin",
                clinic_id=1,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print("Новый пользователь создан")
        
        print("Тестовый пользователь:")
        print("Телефон: +77770000000")
        print("Пароль: test123")
        print("Роль: admin")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
