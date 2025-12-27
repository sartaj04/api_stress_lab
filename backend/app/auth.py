from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import hashlib
import secrets

from .config import settings
from .database import get_db
from .models import User, ApiKey

security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode = {"sub": str(user_id), "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None


def generate_api_key() -> tuple[str, str]:
    """Generate an API key and its hash. Returns (key, hash)."""
    key = f"asl_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    return key, key_hash


def verify_api_key(key: str) -> str:
    """Hash an API key for comparison."""
    return hashlib.sha256(key.encode()).hexdigest()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    
    # First try JWT token
    user_id = decode_token(token)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return user
    
    # Try API key
    if token.startswith("asl_"):
        key_hash = verify_api_key(token)
        api_key = db.query(ApiKey).filter(
            ApiKey.key_hash == key_hash,
            ApiKey.is_active == True
        ).first()
        if api_key:
            api_key.last_used_at = datetime.utcnow()
            db.commit()
            return api_key.user
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def check_user_credits(user: User, estimated_credits: int = 5) -> None:
    """Check if user has sufficient credits. Raises HTTPException if not."""
    if user.credit_balance < estimated_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {estimated_credits}, Available: {user.credit_balance}"
        )


def get_default_limits() -> dict:
    """Get default run limits (no tier restrictions in credit model)."""
    return {
        "max_vus": 200,
        "max_duration": 600,  # 10 minutes
        "max_per_run": 100000,
    }

