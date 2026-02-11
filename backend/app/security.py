from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPBasicCredentials
from sqlalchemy.orm import Session
from app.database import get_db

# Create password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# Security scheme for JWT
security = HTTPBearer()


def get_current_user(credentials: HTTPBasicCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Extract and validate JWT token, return current user.
    Used as a dependency in protected endpoints.
    """
    token = credentials.credentials

    # Verify token
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    # Get user_id from token
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Get user from database
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user