from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database (Supabase PostgreSQL)
    database_url: str = "postgresql://postgres:HdaGkwx1H0pZDdqp@db.hmvctdrrudemffnvllbl.supabase.co:5432/postgres"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # S3-Compatible Storage (MinIO, Cloudflare R2, AWS S3)
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_secure: bool = False
    
    # Alternative S3 config (takes priority if set)
    s3_endpoint: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_bucket_specs: str = "specs"
    s3_bucket_artifacts: str = "artifacts"
    s3_bucket_reports: str = "reports"
    
    # Security
    jwt_secret: str = "super-secret-jwt-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    encryption_key: str = "32-byte-encryption-key-here!!!"
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # OpenAI
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    
    # Stripe
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    
    # App URLs
    frontend_url: str = "http://localhost:3000"
    
    # Credit packages: {price_id: {name, credits, price_cents}}
    credit_packages: dict = {
        "price_intro": {"name": "Intro", "credits": 150, "price_cents": 1000},
        "price_standard": {"name": "Standard", "credits": 450, "price_cents": 2500},
        "price_value": {"name": "Value", "credits": 1000, "price_cents": 5000},
        "price_pro": {"name": "Pro", "credits": 2400, "price_cents": 10000},
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
