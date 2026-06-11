from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GrowthStage(str, Enum):
    SEED = "Seed"
    GERMINATION = "Germination"
    VEGETATIVE = "Vegetative"
    FLOWERING = "Flowering"
    FRUITING = "Fruiting"
    HARVEST = "Harvest"


class CropStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    FAILED = "Failed"


class CropBase(BaseModel):
    farm_id: UUID
    crop_name: str = Field(min_length=1, max_length=255)
    crop_type: str = Field(min_length=1, max_length=128)
    category: str = Field(min_length=1, max_length=128)
    growth_stage: GrowthStage
    planting_date: date
    expected_harvest_date: date
    status: CropStatus
    season: Optional[str] = Field(default=None, max_length=32)


class CropCreate(CropBase):
    @field_validator("expected_harvest_date")
    @classmethod
    def validate_expected_harvest_date(cls, value, info):
        planting_date = info.data.get("planting_date")
        if planting_date is not None and value <= planting_date:
            raise ValueError("Expected harvest date must be after planting date")
        return value


class CropUpdate(BaseModel):
    farm_id: Optional[UUID] = None
    crop_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    crop_type: Optional[str] = Field(default=None, min_length=1, max_length=128)
    category: Optional[str] = Field(default=None, min_length=1, max_length=128)
    growth_stage: Optional[GrowthStage] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    status: Optional[CropStatus] = None
    season: Optional[str] = Field(default=None, max_length=32)

    @field_validator("expected_harvest_date")
    @classmethod
    def validate_expected_harvest_date(cls, value, info):
        planting_date = info.data.get("planting_date")
        if planting_date is not None and value is not None and value <= planting_date:
            raise ValueError("Expected harvest date must be after planting date")
        return value


class CropRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    owner_id: int
    crop_name: str
    crop_type: str
    category: str
    growth_stage: GrowthStage
    planting_date: date
    expected_harvest_date: date
    status: CropStatus
    season: Optional[str] = None
    farm_name: str
    created_at: datetime
    updated_at: datetime
