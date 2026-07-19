from fastapi import APIRouter, Request, status
from pydantic import BaseModel, EmailStr, Field

from app.core.limiter import limiter
from app.services.email import send_contact_message_email

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


@router.post("", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
def submit_contact_message(request: Request, payload: ContactMessage):
    send_contact_message_email(payload.name, payload.email, payload.subject, payload.message)
    return {"status": "sent"}
