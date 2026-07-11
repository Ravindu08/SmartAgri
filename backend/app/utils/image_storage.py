import base64
import re
import uuid
from io import BytesIO
from pathlib import Path
from typing import Optional

from PIL import Image, UnidentifiedImageError

# Shared by marketplace listings and cultivation task photos — both accept a
# base64 data URI from the browser and need it persisted the same way.
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # reject anything decoding larger than this
MAX_DIMENSION = 1600  # longest side, px — downscaled if the source exceeds it
JPEG_QUALITY = 85

_DATA_URI_RE = re.compile(r"data:image/(\w+);base64,(.+)", re.DOTALL)


class ImageTooLargeError(ValueError):
    pass


def store_image(data_uri: Optional[str]) -> Optional[str]:
    """Persist a base64 image data URI to UPLOAD_DIR and return its /uploads/ URL.

    Non-data-URI values (already-stored URLs, None, empty string) pass through
    unchanged. Oversized uploads raise ImageTooLargeError; callers should catch
    it and turn it into a 400/413 response.
    """
    if not data_uri or not data_uri.startswith("data:image/"):
        return data_uri

    match = _DATA_URI_RE.match(data_uri)
    if not match:
        return data_uri

    raw = base64.b64decode(match.group(2))
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ImageTooLargeError(f"Image exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)}MB upload limit")

    UPLOAD_DIR.mkdir(exist_ok=True)

    try:
        img = Image.open(BytesIO(raw))
        img.load()
        img = img.convert("RGB")
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
        filename = f"{uuid.uuid4().hex}.jpg"
        img.save(UPLOAD_DIR / filename, "JPEG", quality=JPEG_QUALITY, optimize=True)
    except UnidentifiedImageError:
        # Not a format Pillow can decode — store the raw bytes as-is rather
        # than reject an otherwise-valid upload outright.
        ext = "jpg" if match.group(1).lower() in ("jpeg", "jpg") else match.group(1).lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        (UPLOAD_DIR / filename).write_bytes(raw)

    return f"/uploads/{filename}"
