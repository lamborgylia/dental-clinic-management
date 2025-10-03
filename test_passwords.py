#!/usr/bin/env python3
"""
Тест паролей с существующим хешем
"""

import bcrypt

def test_passwords():
    """Тестирует разные пароли с существующим хешем"""
    
    print("🔧 ТЕСТ ПАРОЛЕЙ С СУЩЕСТВУЮЩИМ ХЕШЕМ")
    print("=" * 50)
    
    # Хеш из базы данных
    existing_hash = "$2b$12$AFL7x0fCdvyB3xVs9j466uC8zqWj1cFVgrNPa97LK.a"
    existing_hash_bytes = existing_hash.encode('utf-8')
    
    print(f"🔐 Тестируем хеш: {existing_hash[:50]}...")
    
    # Тестируем разные пароли
    passwords_to_test = [
        'admin123',
        'admin',
        'password',
        '123456',
        'admin1234',
        'Admin123',
        'ADMIN123',
        'admin123!',
        'admin123@',
        'admin123#'
    ]
    
    for password in passwords_to_test:
        password_bytes = password.encode('utf-8')
        is_valid = bcrypt.checkpw(password_bytes, existing_hash_bytes)
        status = "✅" if is_valid else "❌"
        print(f"{status} Пароль \"{password}\": {is_valid}")

if __name__ == "__main__":
    test_passwords()
