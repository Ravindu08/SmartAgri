from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, PositiveFloat, model_validator


class FarmSeason(str, Enum):
    MAHA = "Maha"
    YALA = "Yala"
    YEAR_ROUND = "Year-round"


class SriLankaDistrict(str, Enum):
    AMPARA = "Ampara"
    ANURADHAPURA = "Anuradhapura"
    BADULLA = "Badulla"
    BATTICALOA = "Batticaloa"
    COLOMBO = "Colombo"
    GALLE = "Galle"
    GAMPAHA = "Gampaha"
    HAMBANTOTA = "Hambantota"
    JAFFNA = "Jaffna"
    KALUTARA = "Kalutara"
    KANDY = "Kandy"
    KEGALLE = "Kegalle"
    KILINOCHCHI = "Kilinochchi"
    KURUNEGALA = "Kurunegala"
    MANNAR = "Mannar"
    MATALE = "Matale"
    MATARA = "Matara"
    MONARAGALA = "Monaragala"
    MULLAITIVU = "Mullaitivu"
    NUWARA_ELIYA = "Nuwara Eliya"
    POLONNARUWA = "Polonnaruwa"
    PUTTALAM = "Puttalam"
    RATNAPURA = "Ratnapura"
    TRINCOMALEE = "Trincomalee"
    VAVUNIYA = "Vavuniya"


class SoilType(str, Enum):
    ALLUVIAL = "Alluvial"
    ALLUVIAL_LOAM = "Alluvial Loam"
    BOG = "Bog and Half-Bog Soil"
    CLAY_LOAM = "Clay Loam"
    CLAY = "Clay Soil"
    DEEP_LOAM = "Deep Loam"
    DEEP_SANDY_LOAM = "Deep Sandy Loam"
    FERTILE_LOAM = "Fertile Loam"
    HUMIC_GLEY = "Humic Gley"
    IMMATURE_BROWN_LOAM = "Immature Brown Loam"
    LATERITIC_LOAM = "Lateritic Loam"
    LATERITIC = "Lateritic Soil"
    LIGHT_LOAM = "Light Loam"
    LIGHT_SANDY_LOAM = "Light Sandy Loam"
    LOAM = "Loam"
    LOAMY_SAND = "Loamy Sand"
    LOW_HUMIC_GLEY = "Low-Humic Gley"
    MARSHY = "Marshy Soil"
    MOUNTAIN_REGOSOL = "Mountain Regosol"
    NON_CALCIC_BROWN = "Non-Calcic Brown Earth"
    ORGANIC_RICH_LOAM = "Organic-Rich Loam"
    RED_LOAM = "Red Loam"
    RED_BROWN_EARTH = "Red-Brown Earth"
    RED_YELLOW_LATOSOL = "Red-Yellow Latosol"
    RED_YELLOW_PODZOLIC = "Red-Yellow Podzolic"
    REDDISH_BROWN_EARTH = "Reddish-Brown Earth"
    REDDISH_BROWN_LATOSOL = "Reddish-Brown Latosol"
    REGOSOL = "Regosol"
    SANDY_CLAY_LOAM = "Sandy Clay Loam"
    SANDY_LOAM = "Sandy Loam"
    SANDY_REGOSOL = "Sandy Regosol"
    SANDY = "Sandy Soil"
    SILT_LOAM = "Silt Loam"
    WELL_DRAINED_LOAM = "Well Drained Loam"


class IrrigationType(str, Enum):
    RAINFED = "Rainfed"
    IRRIGATED = "Irrigated"
    SUPPLEMENTAL = "Supplemental"


class SizeUnit(str, Enum):
    ACRES = "acres"
    HECTARES = "hectares"
    PERCHES = "perches"
    SQM = "sq. meters"


# PositiveFloat alone accepts 999999999, so sizes are also capped. The cap is
# applied in acre-equivalent because the same number means wildly different
# areas depending on the unit. 100,000 acres is far larger than any single
# Sri Lankan holding (national farmland is roughly 5 million acres), so this
# rejects nonsense without ever getting in a real user's way.
_ACRES_PER_UNIT = {
    SizeUnit.ACRES:    1.0,
    SizeUnit.HECTARES: 2.47105,
    SizeUnit.PERCHES:  1.0 / 160.0,
    SizeUnit.SQM:      1.0 / 4046.86,
}
MAX_FARM_SIZE_ACRES = 100_000.0


def _validate_farm_size(size: Optional[float], unit: Optional[SizeUnit]) -> None:
    """Reject sizes that are not a real farm. No-op when either field is absent."""
    if size is None:
        return
    acres = size * _ACRES_PER_UNIT.get(unit or SizeUnit.ACRES, 1.0)
    if acres > MAX_FARM_SIZE_ACRES:
        raise ValueError(
            f"farm_size {size} {(unit or SizeUnit.ACRES).value} is unrealistically large "
            f"(max {MAX_FARM_SIZE_ACRES:,.0f} acres)."
        )


class FarmBase(BaseModel):
    farm_name: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    district: Optional[SriLankaDistrict] = None
    farm_size: PositiveFloat
    size_unit: SizeUnit = SizeUnit.ACRES
    soil_type: SoilType
    irrigation_type: Optional[IrrigationType] = None
    cultivated_crops: Optional[str] = None  # comma-separated crop names
    season: FarmSeason
    image_data: Optional[str] = None

    @model_validator(mode="after")
    def check_farm_size(self):
        _validate_farm_size(self.farm_size, self.size_unit)
        return self


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, min_length=1, max_length=255)
    district: Optional[SriLankaDistrict] = None
    farm_size: Optional[PositiveFloat] = None
    size_unit: Optional[SizeUnit] = None
    soil_type: Optional[SoilType] = None
    irrigation_type: Optional[IrrigationType] = None
    cultivated_crops: Optional[str] = None
    season: Optional[FarmSeason] = None
    image_data: Optional[str] = None

    @model_validator(mode="after")
    def check_farm_size(self):
        # Only checkable when the unit came with the size — a size-only patch
        # would otherwise be measured against the wrong unit and wrongly rejected
        # (200000 perches is a valid 1250 acres, but nonsense read as acres).
        if self.size_unit is not None:
            _validate_farm_size(self.farm_size, self.size_unit)
        return self


class FarmRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_name: str
    location: str
    district: Optional[str] = None
    farm_size: float
    size_unit: str = "acres"
    soil_type: str
    irrigation_type: Optional[str] = None
    cultivated_crops: Optional[str] = None
    season: FarmSeason
    image_data: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: datetime
