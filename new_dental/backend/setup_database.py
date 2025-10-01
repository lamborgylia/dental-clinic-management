#!/usr/bin/env python3
"""
Автоматический скрипт для настройки базы данных PostgreSQL
Создает пользователя, базу данных и инициализирует схему
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Выполняет команду и выводит результат"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - успешно")
            return True
        else:
            print(f"❌ {description} - ошибка: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - исключение: {e}")
        return False

def create_database_script():
    """Создает SQL скрипт для настройки БД"""
    sql_script = """
-- Скрипт настройки базы данных для Dental Clinic System
-- Выполните этот скрипт в psql как пользователь postgres

-- Создание пользователя superadmin
CREATE USER superadmin WITH PASSWORD '1234' CREATEDB;

-- Создание базы данных new_dental
CREATE DATABASE new_dental OWNER superadmin;

-- Подключение к новой базе данных
\\c new_dental

-- Предоставление прав пользователю superadmin
GRANT ALL PRIVILEGES ON DATABASE new_dental TO superadmin;
GRANT ALL PRIVILEGES ON SCHEMA public TO superadmin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO superadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO superadmin;

-- Выход
\\q
"""
    
    script_path = Path("setup_database.sql")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(sql_script)
    
    print(f"📝 SQL скрипт создан: {script_path}")
    return script_path

def setup_database():
    """Основная функция настройки БД"""
    print("🚀 Настройка базы данных для Dental Clinic System")
    print("=" * 50)
    
    # Проверка PostgreSQL
    if not run_command("pg_isready", "Проверка доступности PostgreSQL"):
        print("❌ PostgreSQL не доступен. Убедитесь, что сервис запущен.")
        return False
    
    # Создание SQL скрипта
    script_path = create_database_script()
    
    print("\n📋 Инструкции по настройке:")
    print("1. Подключитесь к PostgreSQL как пользователь postgres:")
    print("   psql -U postgres")
    print("2. Выполните SQL скрипт:")
    print(f"   \\i {script_path}")
    print("3. Или выполните команды вручную:")
    print("   CREATE USER superadmin WITH PASSWORD '1234' CREATEDB;")
    print("   CREATE DATABASE new_dental OWNER superadmin;")
    
    # Попытка автоматического выполнения
    print("\n🔄 Попытка автоматического создания...")
    
    # Создание пользователя
    if run_command("psql -U postgres -c \"CREATE USER superadmin WITH PASSWORD '1234' CREATEDB;\"", "Создание пользователя superadmin"):
        # Создание базы данных
        if run_command("psql -U postgres -c \"CREATE DATABASE new_dental OWNER superadmin;\"", "Создание базы данных new_dental"):
            print("✅ База данных успешно создана!")
            
            # Проверка подключения
            if run_command("psql -U superadmin -d new_dental -c \"SELECT version();\"", "Проверка подключения"):
                print("🎉 Настройка базы данных завершена успешно!")
                return True
            else:
                print("⚠️  База данных создана, но есть проблемы с подключением")
                return False
        else:
            print("❌ Не удалось создать базу данных")
            return False
    else:
        print("❌ Не удалось создать пользователя")
        return False

def main():
    """Главная функция"""
    try:
        success = setup_database()
        if success:
            print("\n🎯 Следующие шаги:")
            print("1. Скопируйте .env файл: cp env.example .env")
            print("2. Инициализируйте БД: python3 init_db.py")
            print("3. Запустите сервер: python3 run.py")
        else:
            print("\n⚠️  Настройка не завершена. Выполните команды вручную.")
            print("Используйте созданный SQL скрипт или выполните команды из инструкций выше.")
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Операция прервана пользователем")
        return 1
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
