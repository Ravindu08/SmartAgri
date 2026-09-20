"""SQLAlchemy model package.

Importing every model module here is what populates ``Base.metadata``. Alembic's
env.py relies on it (``from app import models``) so that autogenerate can see the
full schema — without these imports it would see no tables and emit DROPs.
``__all__`` marks them as deliberate re-exports rather than unused imports.
"""

from app.models.activity import Feedback, UserActivity
from app.models.crop import Crop
from app.models.cultivation import CultivationSession, CultivationTask
from app.models.farm import Farm
from app.models.marketplace import MarketplaceListing, MarketplaceOrder
from app.models.user import User, UserRole

__all__ = [
    "Crop",
    "CultivationSession",
    "CultivationTask",
    "Farm",
    "Feedback",
    "MarketplaceListing",
    "MarketplaceOrder",
    "User",
    "UserActivity",
    "UserRole",
]
