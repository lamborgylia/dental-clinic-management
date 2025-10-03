from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ..core.database import get_db
from ..core.security import verify_password
from ..core.auth import create_access_token
from ..core.config import settings
from ..core.auth import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("/test")
async def test_endpoint():
    """Тестовый эндпоинт для проверки работы"""
    return {"message": "Auth router работает!", "status": "ok"}


@router.post("/login", response_model=dict)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        print(f"🔍 Попытка входа: {form_data.username}")
        
        # Ищем пользователя
        user = db.query(User).filter(User.phone == form_data.username).first()
        print(f"👤 Найден пользователь: {user is not None}")
        
        if not user:
            print("❌ Пользователь не найден")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный телефон или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Проверяем пароль
        print(f"🔐 Проверка пароля...")
        password_valid = verify_password(form_data.password, user.password_hash)
        print(f"🔐 Пароль валиден: {password_valid}")
        
        if not password_valid:
            print("❌ Неверный пароль")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный телефон или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Проверяем активность
        if not user.is_active:
            print("❌ Пользователь неактивен")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь неактивен"
            )
        
        # Создаем токен
        print(f"🎫 Создание токена...")
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.phone}, expires_delta=access_token_expires
        )
        print(f"🎫 Токен создан: {access_token[:20]}...")
        
        result = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "phone": user.phone,
                "role": user.role,
                "clinic_id": user.clinic_id
            }
        }
        
        print(f"✅ Успешный вход: {user.full_name}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Ошибка в login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о текущем пользователе"""
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "clinic_id": current_user.clinic_id,
        "is_active": current_user.is_active
    }