from minio import Minio
from .config import settings
import io


def get_s3_client() -> Minio:
    """Get S3-compatible client (Cloudflare R2)."""
    return Minio(
        settings.s3_endpoint,
        access_key=settings.s3_access_key,
        secret_key=settings.s3_secret_key,
        secure=settings.s3_secure
    )


def upload_file(prefix: str, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload a file to S3. Prefix (specs/artifacts) becomes part of the key."""
    client = get_s3_client()
    full_key = f"{prefix}/{key}"
    client.put_object(
        settings.s3_bucket,
        full_key,
        io.BytesIO(data),
        len(data),
        content_type=content_type
    )
    return full_key


def download_file(prefix: str, key: str) -> bytes:
    """Download a file from S3."""
    client = get_s3_client()
    full_key = f"{prefix}/{key}"
    response = client.get_object(settings.s3_bucket, full_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def delete_file(prefix: str, key: str) -> None:
    """Delete a file from S3."""
    client = get_s3_client()
    full_key = f"{prefix}/{key}"
    client.remove_object(settings.s3_bucket, full_key)
