# Dental Clinic Management System

Полноценная система управления стоматологическими клиниками с backend на FastAPI и frontend на React.

## 🏗️ Архитектура

Проект состоит из двух основных частей:
- **Backend** - FastAPI + PostgreSQL + SQLAlchemy + Alembic
- **Frontend** - React + TypeScript + Vite + Tailwind CSS

## 🚀 Быстрый старт

### Предварительные требования

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- pip, npm

### 1. Клонирование и настройка

```bash
git clone <repository-url>
cd new_dental
```

### 2. Backend

```bash
cd backend

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установка зависимостей
pip install -r requirements.txt

# Настройка базы данных
cp env.example .env
# Отредактируйте .env файл с вашими параметрами БД

# Создание базы данных
createdb dental_db

# Инициализация БД
python init_db.py

# Запуск сервера
python run.py
```

Backend будет доступен по адресу: http://localhost:8000

### 3. Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

Frontend будет доступен по адресу: http://localhost:5173

## 📋 Функциональность

### Роли пользователей
- **Администратор** - полный доступ ко всем функциям
- **Врач** - управление пациентами, планы лечения, наряды
- **Медсестра** - управление пациентами, планы лечения, наряды
- **Регистратор** - управление пациентами и записями на прием

### Основные модули
- **Пациенты** - база данных пациентов с поиском
- **Записи на прием** - планирование и управление приемами
- **Планы лечения** - создание и ведение планов лечения
- **Наряды** - формирование нарядов на основе планов
- **Услуги** - прайс-лист клиники
- **Клиники** - управление сетью клиник (для админов)
- **Пользователи** - управление персоналом (для админов)

## 🗄️ База данных

### Основные сущности
1. **Пациенты** - единая база для всех клиник
2. **Пользователи** - сотрудники клиник с ролями
3. **Клиники** - сеть клиник
4. **Услуги** - прайс-лист с ценами
5. **Записи** - расписание приемов
6. **Планы лечения** - назначения врачей
7. **Наряды** - счета за услуги

### Миграции
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## 🔐 Аутентификация

- JWT токены для авторизации
- Ролевая система доступа
- Автоматическое обновление токенов
- Защищенные маршруты по ролям

## 📱 Frontend особенности

- Адаптивный дизайн с Tailwind CSS
- TypeScript для типобезопасности
- React Router для навигации
- Axios для API запросов
- Автоматическая обработка ошибок авторизации

## 🧪 Тестирование

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 📦 Развертывание

### Backend
```bash
cd backend
pip install -r requirements.txt
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
cd frontend
npm run build
# Разместите содержимое dist/ на веб-сервере
```

## 🔧 Конфигурация

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dental_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SUPERUSER_PHONE=+77771234567
SUPERUSER_PASSWORD=admin123
SUPERUSER_FULL_NAME=Системный Администратор
```

### Frontend
Настройки API в `src/services/api.ts`

## 📚 Документация API

После запуска backend документация доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Разработка

### Структура проекта
```
new_dental/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Конфигурация, БД, безопасность
│   │   ├── models/         # SQLAlchemy модели
│   │   ├── schemas/        # Pydantic схемы
│   │   ├── routers/        # API роутеры
│   │   └── main.py         # Основное приложение
│   ├── alembic/            # Миграции БД
│   ├── requirements.txt    # Python зависимости
│   └── README.md           # Документация backend
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── services/       # API сервисы
│   │   ├── types/          # TypeScript типы
│   │   └── App.tsx         # Главный компонент
│   ├── package.json        # Node.js зависимости
│   └── README.md           # Документация frontend
└── README.md               # Основная документация
```

### Добавление новых функций

1. **Backend**: создайте модель, схему, роутер
2. **Frontend**: создайте страницу, добавьте маршрут
3. **Обновите документацию**

## 📄 Лицензия

MIT License

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи backend и frontend
2. Убедитесь в корректности настроек БД
3. Проверьте версии зависимостей
4. Создайте issue в репозитории

## 🚀 Roadmap

- [ ] Мобильное приложение
- [ ] Интеграция с платежными системами
- [ ] Система уведомлений
- [ ] Аналитика и отчеты
- [ ] Мультиязычность
- [ ] API для внешних интеграций
