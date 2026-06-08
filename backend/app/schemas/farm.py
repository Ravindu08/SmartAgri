from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, PositiveFloat


class FarmSeason(str, Enum):
    YALA = "Yala"
    MAHA = "Maha"


class FarmBase(BaseModel):
    farm_name: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    farm_size: PositiveFloat
    soil_type: str = Field(min_length=1, max_length=128)
    season: FarmSeason


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, min_length=1, max_length=255)
    farm_size: Optional[PositiveFloat] = None
    soil_type: Optional[str] = Field(default=None, min_length=1, max_length=128)
    season: Optional[FarmSeason] = None


class FarmRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_name: str
    location: str
    farm_size: float
    soil_type: str
    season: FarmSeason
    owner_id: int
    created_at: datetime
    updated_at: datetime
