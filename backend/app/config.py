from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database (Supabase PostgreSQL)
    database_url: str
    
    # Redis (Upstash)
    redis_url: str
    
    # S3-Compatible Storage (Cloudflare R2)
    s3_endpoint: str
    s3_access_key: str
    s3_secret_key: str
    s3_bucket: str = "apistresslab"
    s3_secure: bool = True
    
    # Security
    jwt_secret: str = "none"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    encryption_key: str = "none"
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # OpenAI
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    
    # Stripe
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    
    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    
    # App URLs
    frontend_url: str = "http://localhost:3000"
    
    # Email (SMTP) - Optional, for password reset emails
    smtp_enabled: bool = False
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_use_tls: bool = True
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: str = "noreply@apistresslab.com"
    
    # Credit packages: {price_id: {name, credits, price_cents}}
    credit_packages: dict = {
        "price_intro": {"name": "Intro", "credits": 50, "price_cents": 1000},
        "price_standard": {"name": "Standard", "credits": 150, "price_cents": 2500},
        "price_value": {"name": "Value", "credits": 350, "price_cents": 5000},
        "price_pro": {"name": "Pro", "credits": 800, "price_cents": 10000},
    }
    
    # Credit calculation constants
    credits_per_10k_requests: int = 1  # ceil(requests / 10,000)
    credits_per_50_vu_minutes: int = 1  # ceil(vu_minutes / 50)
    min_credits_per_run: int = 5
    
    # Free credits on signup
    free_credits_on_signup: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
