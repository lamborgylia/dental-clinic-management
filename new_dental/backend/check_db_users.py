#!/usr/bin/env python3
"""
Проверяем пользователей в базе данных
"""

from app.core.database import SessionLocal
from app.models.user import User
from sqlalchemy import text

def main():
    print("🔍 Проверяем пользователей в базе данных...")
    
    db = SessionLocal()
    try:
        # Получаем всех пользователей
        users = db.query(User).all()
        
        print(f"📊 Найдено пользователей: {len(users)}")
        
        for user in users:
            print(f"👤 ID: {user.id}")
            print(f"   Имя: {user.full_name}")
            print(f"   Телефон: {user.phone}")
            print(f"   Роль: {user.role}")
            print(f"   Активен: {user.is_active}")
            print()
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()

