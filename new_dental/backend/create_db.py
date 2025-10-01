import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    try:
        # Подключаемся к postgres для создания новой БД
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            user="maksimdudaruk",
            password="",
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Создаем пользователя
        try:
            cursor.execute("CREATE USER superadmin WITH PASSWORD '1234' CREATEDB;")
            print("✅ Пользователь superadmin создан")
        except psycopg2.errors.DuplicateObject:
            print("ℹ️  Пользователь superadmin уже существует")
        
        # Создаем базу данных
        try:
            cursor.execute("CREATE DATABASE new_dental OWNER superadmin;")
            print("✅ База данных new_dental создана")
        except psycopg2.errors.DuplicateDatabase:
            print("ℹ️  База данных new_dental уже существует")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Ошибка при создании БД: {e}")
        print("Попробуйте создать БД вручную:")
        print("1. Подключитесь к PostgreSQL")
        print("2. Выполните: CREATE USER superadmin WITH PASSWORD '1234' CREATEDB;")
        print("3. Выполните: CREATE DATABASE new_dental OWNER superadmin;")

if __name__ == "__main__":
    create_database()

