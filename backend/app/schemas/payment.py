from datetime import datetime

from pydantic import BaseModel


class PaymentSimulateResponse(BaseModel):
    status: str
    amount: float
    currency: str
    paid_at: datetime
