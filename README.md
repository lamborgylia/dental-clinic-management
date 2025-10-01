# Dental Clinic Management System

Система управления стоматологической клиникой с возможностью записи пациентов, создания планов лечения и управления услугами.

## Технологии

### Backend
- Python 3.8+
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- CSS3

## Установка и запуск

### Backend

1. Перейдите в папку backend:
```bash
cd backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Запустите сервер:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

1. Перейдите в папку frontend-new:
```bash
cd frontend-new
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите dev сервер:
```bash
npm run dev
```

## API Endpoints

- `POST /auth/login` - Авторизация
- `GET /patients/` - Список пациентов
- `GET /services/` - Список услуг
- `GET /appointments/` - Список записей
- `POST /treatment-plans/` - Создание плана лечения

## Структура проекта

```
new_dental/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── models/   # SQLAlchemy модели
│   │   ├── schemas/  # Pydantic схемы
│   │   ├── api/      # API endpoints
│   │   └── main.py   # Главный файл приложения
│   └── requirements.txt
├── frontend-new/     # React frontend
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   ├── services/    # API сервисы
│   │   └── types/       # TypeScript типы
│   └── package.json
└── README.md
```

## Деплой на Render

1. Подключите репозиторий к Render
2. Создайте Web Service для backend
3. Создайте Static Site для frontend
4. Настройте переменные окружения для подключения к базе данных
