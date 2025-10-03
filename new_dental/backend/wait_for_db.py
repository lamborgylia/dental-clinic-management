#!/usr/bin/env python3
"""
Скрипт для ожидания готовности базы данных на Render
"""

import os
import sys
import time
import psycopg2
from psycopg2 import OperationalError

def wait_for_database():
    """Ждет, пока база данных будет готова к подключению"""
    
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL не найден в переменных окружения")
        return False
    
    print("⏳ Ожидание готовности базы данных...")
    
    max_retries = 30  # 5 минут максимум
    retry_delay = 10  # 10 секунд между попытками
    
    for attempt in range(max_retries):
        try:
            print(f"🔗 Попытка подключения {attempt + 1}/{max_retries}...")
            
            # Пробуем подключиться напрямую через psycopg2
            conn = psycopg2.connect(
                database_url,
                connect_timeout=10,
                sslmode='disable'
            )
            
            # Тестируем подключение
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            
            print("✅ База данных готова к работе!")
            return True
            
        except OperationalError as e:
            print(f"⚠️ Попытка {attempt + 1} неудачна: {e}")
            if attempt < max_retries - 1:
                print(f"⏳ Ждем {retry_delay} секунд...")
                time.sleep(retry_delay)
            else:
                print("❌ База данных не готова после всех попыток")
                return False
        except Exception as e:
            print(f"❌ Неожиданная ошибка: {e}")
            return False
    
    return False

if __name__ == "__main__":
    print("🚀 Ожидание готовности базы данных...")
    success = wait_for_database()
    if success:
        print("🎉 База данных готова!")
        sys.exit(0)
    else:
        print("💥 База данных не готова!")
        sys.exit(1)
