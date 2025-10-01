
-- Скрипт настройки базы данных для Dental Clinic System
-- Выполните этот скрипт в psql как пользователь postgres

-- Создание пользователя superadmin
CREATE USER superadmin WITH PASSWORD '1234' CREATEDB;

-- Создание базы данных new_dental
CREATE DATABASE new_dental OWNER superadmin;

-- Подключение к новой базе данных
\c new_dental

-- Предоставление прав пользователю superadmin
GRANT ALL PRIVILEGES ON DATABASE new_dental TO superadmin;
GRANT ALL PRIVILEGES ON SCHEMA public TO superadmin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO superadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO superadmin;

-- Выход
\q
