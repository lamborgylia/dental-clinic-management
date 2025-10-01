from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    superuser_phone: str
    superuser_password: str
    superuser_full_name: str

    class Config:
        env_file = ".env"


settings = Settings()
