import os


class PaymentConfigError(RuntimeError):
    """Raised when a payment endpoint is called but PayHere isn't configured.
    Unlike SECRET_KEY (core/security.py), this does NOT fail app startup —
    most devs won't have payment credentials set up locally, and the rest of
    the app must keep working without them."""


def get_payhere_merchant_id() -> str:
    value = os.getenv("PAYHERE_MERCHANT_ID")
    if not value:
        raise PaymentConfigError("PAYHERE_MERCHANT_ID is not set in backend/.env")
    return value


def get_payhere_merchant_secret() -> str:
    value = os.getenv("PAYHERE_MERCHANT_SECRET")
    if not value:
        raise PaymentConfigError("PAYHERE_MERCHANT_SECRET is not set in backend/.env")
    return value


def is_sandbox_mode() -> bool:
    return os.getenv("PAYHERE_MODE", "sandbox").lower() != "live"


def get_notify_url() -> str:
    value = os.getenv("PAYHERE_NOTIFY_URL")
    if not value:
        raise PaymentConfigError("PAYHERE_NOTIFY_URL is not set in backend/.env")
    return value


def get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
