from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> Notification:
    n = Notification(user_id=user_id, type=type, title=title, body=body, link=link)
    db.add(n)
    db.flush()  # caller commits
    return n
