from minio import Minio
from .config import settings
import io


def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure
    )


def upload_file(bucket: str, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload a file to MinIO and return the key."""
    client = get_minio_client()
    client.put_object(
        bucket,
        key,
        io.BytesIO(data),
        len(data),
        content_type=content_type
    )
    return key


def download_file(bucket: str, key: str) -> bytes:
    """Download a file from MinIO."""
    client = get_minio_client()
    response = client.get_object(bucket, key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def delete_file(bucket: str, key: str) -> None:
    """Delete a file from MinIO."""
    client = get_minio_client()
    client.remove_object(bucket, key)
