from celery import Celery
from .config import settings

# Fix SSL warning by modifying Redis URL to validate cert
redis_url = settings.redis_url
if redis_url and "ssl_cert_reqs=CERT_NONE" in redis_url:
    # Replace CERT_NONE with CERT_REQUIRED for better security
    redis_url = redis_url.replace("ssl_cert_reqs=CERT_NONE", "ssl_cert_reqs=CERT_REQUIRED")

celery_app = Celery(
    "api_stress_lab",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,  # Fix deprecation warning
)
