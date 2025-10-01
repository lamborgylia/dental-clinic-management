@echo off
echo 🚀 Запуск Dental Clinic Management System
echo ==========================================

REM Проверка наличия Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден. Установите Python 3.8+
    pause
    exit /b 1
)

REM Проверка наличия Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден. Установите Node.js 16+
    pause
    exit /b 1
)

echo ✅ Все необходимые компоненты найдены

REM Запуск Backend
echo.
echo 🔧 Запуск Backend...
cd backend

REM Проверка виртуального окружения
if not exist "venv" (
    echo 📦 Создание виртуального окружения...
    python -m venv venv
)

REM Активация виртуального окружения
echo 🔌 Активация виртуального окружения...
call venv\Scripts\activate.bat

REM Установка зависимостей
echo 📥 Установка Python зависимостей...
pip install -r requirements.txt

REM Проверка .env файла
if not exist ".env" (
    echo ⚙️  Создание .env файла...
    copy env.example .env
    echo ⚠️  Отредактируйте .env файл с вашими параметрами БД
    echo    Затем нажмите Enter для продолжения...
    pause
)

REM Инициализация БД
echo 🗄️  Инициализация базы данных...
python init_db.py

REM Запуск backend в новом окне
echo 🚀 Запуск Backend сервера...
start "Backend Server" cmd /k "python run.py"

cd ..

REM Запуск Frontend
echo.
echo 🎨 Запуск Frontend...
cd frontend

REM Установка зависимостей
echo 📥 Установка Node.js зависимостей...
npm install

REM Запуск frontend в новом окне
echo 🚀 Запуск Frontend сервера...
start "Frontend Server" cmd /k "npm run dev"

cd ..

echo.
echo 🎉 Система запущена!
echo.
echo 📍 Backend: http://localhost:8000
echo 📍 Frontend: http://localhost:5173
echo 📍 API Docs: http://localhost:8000/docs
echo.
echo Система запущена в отдельных окнах
echo Закройте окна для остановки серверов
pause
