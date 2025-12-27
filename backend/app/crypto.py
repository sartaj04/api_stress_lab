from cryptography.fernet import Fernet
import base64
import hashlib
from .config import settings


def get_fernet() -> Fernet:
    """Create a Fernet instance from the encryption key."""
    # Ensure key is 32 bytes for Fernet
    key = hashlib.sha256(settings.encryption_key.encode()).digest()
    key_b64 = base64.urlsafe_b64encode(key)
    return Fernet(key_b64)


def encrypt_secret(plaintext: str) -> str:
    """Encrypt a secret string."""
    f = get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_secret(ciphertext: str) -> str:
    """Decrypt a secret string."""
    f = get_fernet()
    return f.decrypt(ciphertext.encode()).decode()
