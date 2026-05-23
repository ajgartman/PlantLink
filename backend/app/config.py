from pydantic_settings import BaseSettings  # Import tool to load .env files

class Settings(BaseSettings):  # Create a settings class
    DATABASE_URL: str  # Database connection string (from .env)
    SECRET_KEY: str  # Security key (from .env)
    ALGORITHM: str = "HS256"  # Encryption algorithm (default value)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # Token expires after 24 hours
    RESEND_API_KEY: str = ""  # Resend email API key (optional)

    class Config:
        env_file = ".env"  # Tell it to read from .env file

settings = Settings()  # Create one instance to use everywhere