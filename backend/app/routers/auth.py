from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, TokenResponse, ApiKeyCreate, ApiKeyResponse
from ..auth import hash_password, verify_password, create_access_token, get_current_user, generate_api_key

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return current_user


@router.post("/api-keys", response_model=ApiKeyResponse)
def create_api_key(
    data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new API key."""
    from ..models import ApiKey
    
    key, key_hash = generate_api_key()
    
    api_key = ApiKey(
        user_id=current_user.id,
        key_hash=key_hash,
        name=data.name
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    return ApiKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key=key,  # Only returned on creation
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        is_active=api_key.is_active
    )


@router.get("/api-keys", response_model=list[ApiKeyResponse])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all API keys for current user."""
    from ..models import ApiKey
    
    keys = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()
    return [
        ApiKeyResponse(
            id=k.id,
            name=k.name,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
            is_active=k.is_active
        )
        for k in keys
    ]


@router.delete("/api-keys/{key_id}")
def delete_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an API key."""
    from ..models import ApiKey
    
    key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.user_id == current_user.id
    ).first()
    
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    db.delete(key)
    db.commit()
    return {"message": "API key deleted"}
