from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from .database import get_db
from .config import settings
from ..models.user import User
from ..models.role import UserRole

# Схема безопасности
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создать JWT токен"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Проверить JWT токен и вернуть phone пользователя"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        phone: str = payload.get("sub")
        if phone is None:
            return None
        return phone
    except JWTError:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Получить текущего пользователя по токену"""
    token = credentials.credentials
    phone = verify_token(token)
    
    if phone is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен аутентификации",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.phone == phone).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь неактивен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def require_role(user: User, allowed_roles: list[UserRole]):
    """Проверить, что у пользователя есть необходимая роль"""
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения операции"
        )
