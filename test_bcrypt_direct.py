#!/usr/bin/env python3
"""
Тест bcrypt напрямую
"""

def test_bcrypt_direct():
    """Тестирует bcrypt напрямую"""
    
    print("🔧 ТЕСТ BCRYPT НАПРЯМУЮ")
    print("=" * 50)
    
    try:
        # Импортируем bcrypt напрямую
        import bcrypt
        print("✅ bcrypt импортирован успешно")
        
        # Тестируем пароль
        password = "admin123"
        password_bytes = password.encode('utf-8')
        print(f"🔐 Тестируем пароль: {password}")
        print(f"🔐 Длина пароля: {len(password)} символов")
        print(f"🔐 Длина в байтах: {len(password_bytes)} байт")
        
        # Создаем соль
        salt = bcrypt.gensalt()
        print(f"🔐 Соль создана: {salt.decode('utf-8')[:20]}...")
        
        # Хешируем пароль
        hashed = bcrypt.hashpw(password_bytes, salt)
        print(f"🔐 Хеш создан: {hashed.decode('utf-8')[:50]}...")
        print(f"🔐 Длина хеша: {len(hashed)} байт")
        
        # Проверяем пароль
        is_valid = bcrypt.checkpw(password_bytes, hashed)
        print(f"🔐 Проверка пароля: {is_valid}")
        
        # Тестируем с существующим хешем из БД
        existing_hash = "$2b$12$AFL7x0fCdvyB3xVs9j466uC8zqWj1cFVgrNPa97LK.a"
        existing_hash_bytes = existing_hash.encode('utf-8')
        print(f"🔐 Тестируем с существующим хешем: {existing_hash[:50]}...")
        
        is_valid_existing = bcrypt.checkpw(password_bytes, existing_hash_bytes)
        print(f"🔐 Проверка существующего хеша: {is_valid_existing}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Ошибка импорта: {e}")
        return False
    except Exception as e:
        print(f"❌ Общая ошибка: {e}")
        return False

if __name__ == "__main__":
    test_bcrypt_direct()
