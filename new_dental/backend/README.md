# Dental Clinic Management System - Backend

Backend система управления стоматологическими клиниками на FastAPI.

## Технологии

- **FastAPI** - современный веб-фреймворк для Python
- **SQLAlchemy** - ORM для работы с базой данных
- **Alembic** - система миграций базы данных
- **PostgreSQL** - реляционная база данных
- **JWT** - аутентификация пользователей
- **Pydantic** - валидация данных

## Установка и запуск

### 1. Создание виртуального окружения

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

### 2. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 3. Настройка базы данных

Создайте файл `.env` на основе `env.example`:

```bash
cp env.example .env
```

Отредактируйте `.env` файл, указав параметры подключения к PostgreSQL:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dental_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SUPERUSER_PHONE=+77771234567
SUPERUSER_PASSWORD=admin123
SUPERUSER_FULL_NAME=Системный Администратор
```

### 4. Создание базы данных

```bash
createdb dental_db
```

### 5. Инициализация базы данных

```bash
python init_db.py
```

### 6. Запуск приложения

```bash
python run.py
```

Приложение будет доступно по адресу: http://localhost:8000

## API Endpoints

### Аутентификация
- `POST /auth/login` - вход в систему

### Клиники (только для админов)
- `GET /clinics` - список клиник
- `POST /clinics` - создание клиники
- `GET /clinics/{id}` - получение клиники
- `PUT /clinics/{id}` - обновление клиники
- `DELETE /clinics/{id}` - деактивация клиники

### Пользователи (только для админов)
- `GET /users` - список пользователей
- `POST /users` - создание пользователя
- `GET /users/{id}` - получение пользователя
- `PUT /users/{id}` - обновление пользователя
- `DELETE /users/{id}` - деактивация пользователя

### Пациенты
- `GET /patients` - список пациентов
- `POST /patients` - создание пациента
- `GET /patients/{id}` - получение пациента
- `PUT /patients/{id}` - обновление пациента
- `GET /patients/search/{term}` - поиск пациентов

### Услуги
- `GET /services` - список услуг
- `POST /services` - создание услуги (только для админов)
- `GET /services/{id}` - получение услуги
- `PUT /services/{id}` - обновление услуги (только для админов)
- `DELETE /services/{id}` - деактивация услуги (только для админов)

### Записи на прием
- `GET /appointments` - список записей
- `POST /appointments` - создание записи
- `GET /appointments/{id}` - получение записи
- `PUT /appointments/{id}` - обновление записи
- `DELETE /appointments/{id}` - отмена записи

### Планы лечения
- `GET /treatment-plans` - список планов лечения
- `POST /treatment-plans` - создание плана лечения
- `GET /treatment-plans/{id}` - получение плана лечения
- `PUT /treatment-plans/{id}` - обновление плана лечения
- `DELETE /treatment-plans/{id}` - удаление плана лечения

### Наряды
- `GET /treatment-orders` - список нарядов
- `POST /treatment-orders` - создание наряда
- `GET /treatment-orders/{id}` - получение наряда
- `PUT /treatment-orders/{id}` - обновление наряда
- `DELETE /treatment-orders/{id}` - удаление наряда

## Роли пользователей

- **ADMIN** - полный доступ ко всем функциям
- **DOCTOR** - доступ к пациентам, планам лечения, нарядам
- **NURSE** - доступ к пациентам, планам лечения, нарядам
- **REGISTRAR** - доступ к пациентам и записям на прием

## Миграции базы данных

### Создание миграции

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Применение миграций

```bash
alembic upgrade head
```

### Откат миграций

```bash
alembic downgrade -1
```

## Документация API

После запуска приложения документация доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
