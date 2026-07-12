import base64
import re
import uuid
from io import BytesIO
from pathlib import Path
from typing import Optional

from PIL import Image

# Shared by marketplace listings and cultivation task photos — both accept a
# base64 data URI from the browser and need it persisted the same way.
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # reject anything decoding larger than this
MAX_DIMENSION = 1600  # longest side, px — downscaled if the source exceeds it
JPEG_QUALITY = 85

_DATA_URI_RE = re.compile(r"data:image/(\w+);base64,(.+)", re.DOTALL)


class ImageTooLargeError(ValueError):
    pass


class InvalidImageError(ValueError):
    pass


def store_image(data_uri: Optional[str]) -> Optional[str]:
    """Persist a base64 image data URI to UPLOAD_DIR and return its /uploads/ URL.

    Non-data-URI values (already-stored URLs, None, empty string) pass through
    unchanged. Oversized uploads raise ImageTooLargeError; content that Pillow
    can't decode as a real image (magic bytes don't match, truncated, or a
    non-image file wearing an image/* content type) raises InvalidImageError.
    Callers should catch both and turn them into 4xx responses.
    """
    if not data_uri or not data_uri.startswith("data:image/"):
        return data_uri

    match = _DATA_URI_RE.match(data_uri)
    if not match:
        return data_uri

    raw = base64.b64decode(match.group(2))
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ImageTooLargeError(f"Image exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)}MB upload limit")

    try:
        img = Image.open(BytesIO(raw))
        img.verify()  # cheap structural check — raises if magic bytes/content don't match
        img = Image.open(BytesIO(raw))  # verify() leaves the file unusable for a real load, reopen
        img.load()
    except Exception as exc:
        raise InvalidImageError("File is not a valid image") from exc

    UPLOAD_DIR.mkdir(exist_ok=True)
    img = img.convert("RGB")
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    filename = f"{uuid.uuid4().hex}.jpg"
    img.save(UPLOAD_DIR / filename, "JPEG", quality=JPEG_QUALITY, optimize=True)

    return f"/uploads/{filename}"
