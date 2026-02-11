from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine (connection to PostgreSQL)
engine = create_engine(settings.DATABASE_URL)

# Create SessionLocal class (for database transactions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class (all models will inherit from this)
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()