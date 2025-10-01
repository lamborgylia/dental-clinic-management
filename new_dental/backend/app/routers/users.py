from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.auth import get_current_user, require_role
from ..core.security import get_password_hash
from ..models.user import User, UserRole
from ..models.clinic import Clinic
from ..schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_users(
    clinic_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список всех пользователей (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    query = db.query(User)
    if clinic_id is not None:
        query = query.filter(User.clinic_id == clinic_id)
    
    users = query.all()
    return users


@router.get("/doctors", response_model=List[UserResponse])
async def get_doctors(
    clinic_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список врачей клиники"""
    # Определяем ID клиники
    target_clinic_id = clinic_id or current_user.clinic_id
    
    if not target_clinic_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не указана клиника"
        )
    
    # Получаем врачей и медсестер клиники
    doctors = db.query(User).filter(
        User.clinic_id == target_clinic_id,
        User.role.in_([UserRole.DOCTOR, UserRole.NURSE]),
        User.is_active == True
    ).all()
    
    return doctors

@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать нового пользователя (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    # Проверяем, что клиника существует
    if user.clinic_id:
        clinic = db.query(Clinic).filter(Clinic.id == user.clinic_id).first()
        if not clinic:
            raise HTTPException(status_code=404, detail="Клиника не найдена")
    
    # Проверяем, что телефон уникален
    existing_user = db.query(User).filter(User.phone == user.phone).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким телефоном уже существует")
    
    db_user = User(
        full_name=user.full_name,
        phone=user.phone,
        password_hash=get_password_hash(user.password),
        role=user.role,
        clinic_id=user.clinic_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о пользователе"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Админ может видеть всех пользователей
    if current_user.role == UserRole.ADMIN:
        return user
    
    # Остальные пользователи могут видеть только пользователей своей клиники
    if user.clinic_id != current_user.clinic_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к информации о пользователе из другой клиники"
        )
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить информацию о пользователе (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем, что клиника существует
    if user_update.clinic_id:
        clinic = db.query(Clinic).filter(Clinic.id == user_update.clinic_id).first()
        if not clinic:
            raise HTTPException(status_code=404, detail="Клиника не найдена")
    
    # Проверяем уникальность телефона
    if user_update.phone and user_update.phone != db_user.phone:
        existing_user = db.query(User).filter(User.phone == user_update.phone).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Пользователь с таким телефоном уже существует")
    
    # Обновляем поля
    for field, value in user_update.dict(exclude_unset=True).items():
        if field == "password" and value:
            setattr(db_user, "password_hash", get_password_hash(value))
        elif field != "password":
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить пользователя (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Нельзя удалить самого себя
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    
    db.delete(user)
    db.commit()
    return {"message": "Пользователь удален"}

@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Активировать пользователя (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.is_active = True
    db.commit()
    return {"message": "Пользователь активирован"}

@router.post("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Деактивировать пользователя (только для админа)"""
    require_role(current_user, [UserRole.ADMIN])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Нельзя деактивировать самого себя
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя деактивировать самого себя")
    
    user.is_active = False
    db.commit()
    return {"message": "Пользователь деактивирован"}
