from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.sql import func
import secrets

from ..database import get_db
from ..models import User, PasswordResetToken, EmailVerificationToken
from ..schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, ApiKeyCreate, ApiKeyResponse,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, ResendVerificationRequest
)
from ..auth import hash_password, verify_password, create_access_token, get_current_user, generate_api_key
from ..config import settings
from ..email import send_password_reset_email, send_email_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str


class GoogleTokenRequest(BaseModel):
    """For frontend-initiated flow using ID token from Google Sign-In"""
    id_token: str


@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account and send verification email."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user (email_verified defaults to False)
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        email_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate verification token
    token = secrets.token_urlsafe(32)
    verification_token = EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(verification_token)
    db.commit()

    # Send verification email
    verification_url = f"{settings.frontend_url}/verify-email?token={token}"
    send_email_verification_email(user.email, verification_url)

    # Generate JWT token (user can log in but cannot run tests until verified)
    jwt_token = create_access_token(user.id)
    return TokenResponse(access_token=jwt_token)


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


@router.get("/verification-status")
def get_verification_status(current_user: User = Depends(get_current_user)):
    """Get email verification status for current user."""
    return {
        "email": current_user.email,
        "email_verified": current_user.email_verified,
        "email_verified_at": current_user.email_verified_at.isoformat() if current_user.email_verified_at else None,
        "auth_provider": current_user.auth_provider,
        "needs_verification": current_user.auth_provider == "email" and not current_user.email_verified
    }


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


# ============ Google OAuth ============

@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Exchange Google authorization code for access token.
    Creates a new user if they don't exist, or logs in existing user.
    """
    try:
        # Exchange authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": data.code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": data.redirect_uri,
                    "grant_type": "authorization_code",
                }
            )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user info from Google
        async with httpx.AsyncClient() as client:
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        google_user = userinfo_response.json()
        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name")
        picture = google_user.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Find or create user
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Check if email exists (user signed up with email before)
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.auth_provider = "google" if not user.hashed_password else user.auth_provider
                if name and not user.full_name:
                    user.full_name = name
                if picture and not user.avatar_url:
                    user.avatar_url = picture
                # Auto-verify when linking Google OAuth
                if not user.email_verified:
                    user.email_verified = True
                    user.email_verified_at = datetime.utcnow()
                db.commit()
            else:
                # Create new user
                user = User(
                    email=email,
                    google_id=google_id,
                    auth_provider="google",
                    full_name=name,
                    avatar_url=picture,
                    credit_balance=settings.free_credits_on_signup,
                    free_credits_claimed=True,
                    email_verified=True,
                    email_verified_at=datetime.utcnow(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        
        # Generate JWT token
        token = create_access_token(user.id)
        return TokenResponse(access_token=token)
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Google: {str(e)}")


@router.post("/google/token", response_model=TokenResponse)
async def google_token_auth(data: GoogleTokenRequest, db: Session = Depends(get_db)):
    """
    Verify Google ID token (for frontend-initiated flow using Google Sign-In button).
    Creates a new user if they don't exist, or logs in existing user.
    """
    try:
        # Verify the ID token with Google
        async with httpx.AsyncClient() as client:
            verify_response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={data.id_token}"
            )
        
        if verify_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid ID token")
        
        token_info = verify_response.json()
        
        # Verify the token is for our app
        if token_info.get("aud") != settings.google_client_id:
            raise HTTPException(status_code=400, detail="Token not intended for this application")
        
        google_id = token_info.get("sub")
        email = token_info.get("email")
        name = token_info.get("name")
        picture = token_info.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Find or create user
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Check if email exists
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                if not user.hashed_password:
                    user.auth_provider = "google"
                if name and not user.full_name:
                    user.full_name = name
                if picture and not user.avatar_url:
                    user.avatar_url = picture
                # Auto-verify when linking Google OAuth
                if not user.email_verified:
                    user.email_verified = True
                    user.email_verified_at = datetime.utcnow()
                db.commit()
            else:
                # Create new user with free credits
                user = User(
                    email=email,
                    google_id=google_id,
                    auth_provider="google",
                    full_name=name,
                    avatar_url=picture,
                    credit_balance=settings.free_credits_on_signup,
                    free_credits_claimed=True,
                    email_verified=True,
                    email_verified_at=datetime.utcnow(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        
        # Generate JWT token
        token = create_access_token(user.id)
        return TokenResponse(access_token=token)
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify token: {str(e)}")


# ============ Password Reset ============

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset. Sends an email with a reset link if the user exists.
    Always returns success to prevent email enumeration.
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    # Only proceed if user exists and has a password (not OAuth-only)
    if user and user.hashed_password:
        # Generate a secure token
        token = secrets.token_urlsafe(32)
        
        # Create reset token record (expires in 1 hour)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(reset_token)
        db.commit()
        
        # Build reset URL
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        
        # Send email
        send_password_reset_email(user.email, token, reset_url)
    
    # Always return success to prevent email enumeration
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using a valid reset token.
    """
    # Find the reset token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    # Get the user
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = hash_password(request.new_password)
    
    # Mark token as used
    reset_token.used = True
    
    # Delete any other unused tokens for this user (excluding the current one)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
        PasswordResetToken.id != reset_token.id
    ).delete()
    
    db.commit()
    
    return {"message": "Password has been reset successfully"}


# ============ Email Verification ============

@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verify email address using a valid verification token.
    """
    # Find the verification token
    verification_token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == request.token,
        EmailVerificationToken.used == False,
        EmailVerificationToken.expires_at > datetime.utcnow()
    ).first()

    if not verification_token:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token"
        )

    # Get the user
    user = db.query(User).filter(User.id == verification_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already verified
    if user.email_verified:
        return {"message": "Email already verified", "already_verified": True}

    # Mark email as verified
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()

    # Mark token as used
    verification_token.used = True

    # Delete any other unused verification tokens for this user
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used == False,
        EmailVerificationToken.id != verification_token.id
    ).delete()

    db.commit()

    return {"message": "Email verified successfully", "already_verified": False}


@router.post("/resend-verification")
def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Resend verification email. Always returns success to prevent email enumeration.
    Only sends if user exists, is not verified, and uses email auth.
    """
    user = db.query(User).filter(User.email == request.email).first()

    # Only proceed if user exists, has email auth, and is not verified
    if user and user.hashed_password and not user.email_verified:
        # Invalidate any existing unused tokens
        db.query(EmailVerificationToken).filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used == False
        ).update({"used": True})

        # Generate new verification token
        token = secrets.token_urlsafe(32)
        verification_token = EmailVerificationToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(verification_token)
        db.commit()

        # Send verification email
        verification_url = f"{settings.frontend_url}/verify-email?token={token}"
        send_email_verification_email(user.email, verification_url)

    # Always return success to prevent email enumeration
    return {"message": "If an unverified account with that email exists, a verification link has been sent."}


@router.post("/waitlist/join")
def join_waitlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join the observability waitlist."""
    if current_user.observability_waitlist_joined:
        return {
            "message": "You're already on the waitlist!",
            "already_joined": True,
            "joined_at": current_user.waitlist_joined_at.isoformat() if current_user.waitlist_joined_at else None
        }
    
    current_user.observability_waitlist_joined = True
    current_user.waitlist_joined_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "You've been added to the waitlist! We'll let you know when observability features are available.",
        "already_joined": False,
        "joined_at": current_user.waitlist_joined_at.isoformat()
    }


@router.get("/waitlist/status")
def get_waitlist_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get waitlist status for current user."""
    return {
        "joined": current_user.observability_waitlist_joined,
        "joined_at": current_user.waitlist_joined_at.isoformat() if current_user.waitlist_joined_at else None
    }
