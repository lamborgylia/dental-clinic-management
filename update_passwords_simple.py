#!/usr/bin/env python3
"""
Простой скрипт для обновления паролей
Использует только bcrypt без passlib
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import bcrypt

def update_passwords():
    """Обновляет пароли с SHA256 на bcrypt"""
    
    # ЗАМЕНИ НА СВОЙ DATABASE_URL
    DATABASE_URL = "postgresql://dental_user:GE2r01YdmUvFGHWf0iGgjRmDFjVFRPIF@dpg-d3fsu156ubrc73cdsgag-a.singapore-postgres.render.com:5432/dental_clinic_l0tc?sslmode=require"
    
    print("🔧 ОБНОВЛЕНИЕ ПАРОЛЕЙ В БАЗЕ ДАННЫХ")
    print("Перевод с SHA256 на bcrypt")
    print("=" * 50)
    
    try:
        # Подключение к базе данных
        print("🔗 Подключение к базе данных...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Подключение установлено!")
        
        # Список пользователей с их паролями
        users_data = [
            ("+77771234567", "admin123"),
            ("+77771234568", "doctor123"),
            ("+77771234569", "nurse123"),
            ("+77771234570", "registrar123"),
            ("+77771234571", "doctor123"),
            ("+77771234572", "nurse123")
        ]
        
        print("🔐 Обновление паролей...")
        
        for phone, password in users_data:
            try:
                # Хешируем пароль с помощью bcrypt
                password_bytes = password.encode('utf-8')
                salt = bcrypt.gensalt()
                hashed_password = bcrypt.hashpw(password_bytes, salt)
                
                # Обновляем пароль в базе данных
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s 
                    WHERE phone = %s;
                """, (hashed_password.decode('utf-8'), phone))
                
                updated_count = cursor.rowcount
                if updated_count > 0:
                    print(f"✅ Пароль обновлен для {phone}")
                else:
                    print(f"⚠️ Пользователь {phone} не найден")
                    
            except Exception as e:
                print(f"❌ Ошибка для {phone}: {e}")
        
        # Проверяем результат
        cursor.execute("SELECT COUNT(*) FROM users;")
        total_users = cursor.fetchone()[0]
        
        print(f"📊 Всего пользователей: {total_users}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 50)
        print("🎉 ОБНОВЛЕНИЕ ПАРОЛЕЙ ЗАВЕРШЕНО!")
        print("=" * 50)
        
        print("\n🔑 Данные для входа:")
        print("Администратор: +77771234567 / admin123")
        print("Доктор: +77771234568 / doctor123")
        print("Медсестра: +77771234569 / nurse123")
        print("Регистратор: +77771234570 / registrar123")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🔧 ОБНОВЛЕНИЕ ПАРОЛЕЙ В БАЗЕ ДАННЫХ")
    print("Перевод с SHA256 на bcrypt")
    print("=" * 50)
    
    success = update_passwords()
    if success:
        print("\n✅ ГОТОВО!")
    else:
        print("\n💥 ОШИБКА!")
