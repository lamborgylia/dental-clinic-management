#!/bin/bash

# Скрипт для запуска серверов

echo "🚀 Запускаем серверы..."

# Останавливаем существующие процессы
pkill -f "uvicorn" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Ждем немного
sleep 2

# Запускаем backend
echo "📡 Запускаем backend сервер..."
cd /Users/maksimdudaruk/Desktop/new_dental/new_dental/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &

# Ждем немного
sleep 3

# Запускаем frontend
echo "🌐 Запускаем frontend сервер..."
cd /Users/maksimdudaruk/Desktop/new_dental/new_dental/frontend-new
npm run dev -- --host &

echo "✅ Серверы запущены!"
echo "📡 Backend: http://192.168.12.93:8001"
echo "🌐 Frontend: http://192.168.12.93:5173"

# Ждем
wait

