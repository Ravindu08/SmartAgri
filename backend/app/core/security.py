from datetime import datetime, timedelta, timezone
import os

from jose import jwt
from passlib.context import CryptContext


_SECRET_KEY = os.getenv("SECRET_KEY")
if not _SECRET_KEY or _SECRET_KEY == "change-this-secret-key":
    raise RuntimeError(
        "SECRET_KEY environment variable is not set or is still the placeholder value. "
        "Set a strong random key in backend/.env before starting the server."
    )
SECRET_KEY = _SECRET_KEY
ALGORITHM = os.getenv("ALGORITHM", "HS256")  # read from .env; default HS256
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# pbkdf2_sha256 — secure, fast, and compatible with Python 3.14+.
# passlib[bcrypt] has a known incompatibility with Python 3.14 / bcrypt>=4.1,
# so we use pbkdf2_sha256 which is the Django-standard PBKDF2 scheme.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, str], expires_delta: timedelta | None = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)