#!/bin/bash

echo "🚀 Запуск Dental Clinic Management System"
echo "=========================================="

# Проверка наличия Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python 3.8+"
    exit 1
fi

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 16+"
    exit 1
fi

# Проверка наличия PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не найден. Установите PostgreSQL 12+"
    exit 1
fi

echo "✅ Все необходимые компоненты найдены"

# Запуск Backend
echo ""
echo "🔧 Запуск Backend..."
cd backend

# Проверка виртуального окружения
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активация виртуального окружения
echo "🔌 Активация виртуального окружения..."
source venv/bin/activate

# Установка зависимостей
echo "📥 Установка Python зависимостей..."
pip install -r requirements.txt

# Проверка .env файла
if [ ! -f ".env" ]; then
    echo "⚙️  Создание .env файла..."
    cp env.example .env
    echo "⚠️  Отредактируйте .env файл с вашими параметрами БД"
    echo "   Затем нажмите Enter для продолжения..."
    read
fi

# Инициализация БД
echo "🗄️  Инициализация базы данных..."
python init_db.py

# Запуск backend в фоне
echo "🚀 Запуск Backend сервера..."
python run.py &
BACKEND_PID=$!

cd ..

# Запуск Frontend
echo ""
echo "🎨 Запуск Frontend..."
cd frontend

# Установка зависимостей
echo "📥 Установка Node.js зависимостей..."
npm install

# Запуск frontend в фоне
echo "🚀 Запуск Frontend сервера..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "🎉 Система запущена!"
echo ""
echo "📍 Backend: http://localhost:8000"
echo "📍 Frontend: http://localhost:5173"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Ожидание сигнала завершения
trap "echo ''; echo '🛑 Остановка системы...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Ожидание завершения процессов
wait
