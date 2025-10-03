#!/usr/bin/env python3
"""
Тест passlib и bcrypt
"""

def test_passlib():
    """Тестирует passlib и bcrypt"""
    
    print("🔧 ТЕСТ PASSLIB И BCRYPT")
    print("=" * 50)
    
    try:
        # Импортируем passlib
        from passlib.context import CryptContext
        print("✅ passlib импортирован успешно")
        
        # Создаем контекст
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        print("✅ CryptContext создан успешно")
        
        # Тестируем пароль
        password = "admin123"
        print(f"🔐 Тестируем пароль: {password}")
        print(f"🔐 Длина пароля: {len(password)} символов")
        
        # Хешируем пароль
        hashed = pwd_context.hash(password)
        print(f"🔐 Хеш создан: {hashed[:50]}...")
        print(f"🔐 Длина хеша: {len(hashed)} символов")
        
        # Проверяем пароль
        is_valid = pwd_context.verify(password, hashed)
        print(f"🔐 Проверка пароля: {is_valid}")
        
        # Тестируем с существующим хешем из БД
        existing_hash = "$2b$12$AFL7x0fCdvyB3xVs9j466uC8zqWj1cFVgrNPa97LK.a"
        print(f"🔐 Тестируем с существующим хешем: {existing_hash[:50]}...")
        
        is_valid_existing = pwd_context.verify(password, existing_hash)
        print(f"🔐 Проверка существующего хеша: {is_valid_existing}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Ошибка импорта: {e}")
        return False
    except Exception as e:
        print(f"❌ Общая ошибка: {e}")
        return False

if __name__ == "__main__":
    test_passlib()
