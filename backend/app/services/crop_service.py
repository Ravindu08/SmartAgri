from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.crop import Crop
from app.models.farm import Farm
from app.schemas.crop import CropCreate, CropUpdate


def create_crop(db: Session, payload: CropCreate, owner_id: int) -> Crop:
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id, Farm.owner_id == owner_id)).scalar_one_or_none()
    if farm is None:
        raise ValueError("Farm not found or does not belong to the logged-in user")

    crop = Crop(
        farm_id=payload.farm_id,
        owner_id=owner_id,
        crop_name=payload.crop_name,
        crop_type=payload.crop_type,
        category=payload.category,
        growth_stage=payload.growth_stage,
        planting_date=payload.planting_date,
        expected_harvest_date=payload.expected_harvest_date,
        status=payload.status,
        season=payload.season,
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


def get_crops_by_owner(db: Session, owner_id: int) -> list[Crop]:
    return db.execute(
        select(Crop).where(Crop.owner_id == owner_id).order_by(Crop.created_at.desc())
    ).scalars().all()


def get_crop_by_owner(db: Session, crop_id: UUID, owner_id: int) -> Crop | None:
    return db.execute(
        select(Crop).where(Crop.id == crop_id, Crop.owner_id == owner_id)
    ).scalar_one_or_none()


def get_crops_by_farm(db: Session, farm_id: UUID, owner_id: int) -> list[Crop]:
    return db.execute(
        select(Crop).where(Crop.farm_id == farm_id, Crop.owner_id == owner_id).order_by(Crop.created_at.desc())
    ).scalars().all()


def update_crop(db: Session, crop: Crop, payload: CropUpdate) -> Crop:
    if payload.farm_id is not None:
        crop.farm_id = payload.farm_id
    if payload.crop_name is not None:
        crop.crop_name = payload.crop_name
    if payload.crop_type is not None:
        crop.crop_type = payload.crop_type
    if payload.category is not None:
        crop.category = payload.category
    if payload.growth_stage is not None:
        crop.growth_stage = payload.growth_stage
    if payload.planting_date is not None:
        crop.planting_date = payload.planting_date
    if payload.expected_harvest_date is not None:
        crop.expected_harvest_date = payload.expected_harvest_date
    if payload.status is not None:
        crop.status = payload.status
    if payload.season is not None:
        crop.season = payload.season

    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


def delete_crop(db: Session, crop: Crop) -> None:
    db.delete(crop)
    db.commit()
