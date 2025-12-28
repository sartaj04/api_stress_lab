from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database (Supabase PostgreSQL)
    database_url: str = "postgresql://postgres:HdaGkwx1H0pZDdqp@db.hmvctdrrudemffnvllbl.supabase.co:5432/postgres"
    
    # Redis (Upstash)
    redis_url: str = "rediss://default:AdzeAAIncDE0YTM1YjMxZTlmOTU0ZjBiYWM1NzkxOGMxZWI3ODUxY3AxNTY1NDI@desired-anemone-56542.upstash.io:6379"
    
    # S3-Compatible Storage (Cloudflare R2)
    s3_endpoint: str = "fe4857cacb5f7b71448e7ba88551750d.r2.cloudflarestorage.com"
    s3_access_key: str = "8777404cd44b2bb5dd75813c902784a7"
    s3_secret_key: str = "89c191df04e32248bbe71784653abeb3bfe01be865fd36c3946a0e94c9d4584e"
    s3_bucket: str = "apistresslab"
    s3_secure: bool = True
    
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
