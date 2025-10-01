from sqlalchemy.orm import Session
from ..core.database import engine, SessionLocal
from ..core.security import get_password_hash
from ..models import Base, Clinic, User, UserRole
from ..core.config import settings


def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if superuser already exists
        superuser = db.query(User).filter(User.phone == settings.superuser_phone).first()
        if superuser:
            return
        
        # Create default clinic if none exists
        clinic = db.query(Clinic).first()
        if not clinic:
            clinic = Clinic(
                name="Главная клиника",
                address="ул. Примерная, 123",
                contacts="+7 (777) 123-45-67"
            )
            db.add(clinic)
            db.commit()
            db.refresh(clinic)
        
        # Create superuser
        superuser = User(
            full_name=settings.superuser_full_name,
            phone=settings.superuser_phone,
            password_hash=get_password_hash(settings.superuser_password),
            role=UserRole.ADMIN,
            clinic_id=clinic.id,
            is_active=True
        )
        db.add(superuser)
        db.commit()
        
        print("Database initialized successfully!")
        print(f"Superuser created: {settings.superuser_phone}")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
