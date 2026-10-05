from fastapi import APIRouter, BackgroundTasks, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.limiter import limiter
from app.services.email import send_contact_message_email, send_quietly

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactMessage(BaseModel):
    # Trimmed first, so a field of spaces fails the minimum length.
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


@router.post("", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
def submit_contact_message(request: Request, payload: ContactMessage, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_quietly, send_contact_message_email,
                              payload.name, payload.email, payload.subject, payload.message)
    return {"status": "sent"}
