from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate


def create_farm(db: Session, farm_in: FarmCreate, owner_id: int) -> Farm:
    farm = Farm(
        farm_name=farm_in.farm_name,
        location=farm_in.location,
        farm_size=farm_in.farm_size,
        soil_type=farm_in.soil_type,
        season=farm_in.season,
        owner_id=owner_id,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


def get_farms_by_owner(db: Session, owner_id: int) -> list[Farm]:
    return db.execute(select(Farm).where(Farm.owner_id == owner_id).order_by(Farm.created_at.desc())).scalars().all()


def get_farm_by_owner(db: Session, farm_id: UUID, owner_id: int) -> Farm | None:
    return db.execute(
        select(Farm).where(Farm.id == farm_id, Farm.owner_id == owner_id)
    ).scalar_one_or_none()


def update_farm(db: Session, farm: Farm, farm_in: FarmUpdate) -> Farm:
    if farm_in.farm_name is not None:
        farm.farm_name = farm_in.farm_name
    if farm_in.location is not None:
        farm.location = farm_in.location
    if farm_in.farm_size is not None:
        farm.farm_size = farm_in.farm_size
    if farm_in.soil_type is not None:
        farm.soil_type = farm_in.soil_type
    if farm_in.season is not None:
        farm.season = farm_in.season

    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


def delete_farm(db: Session, farm: Farm) -> None:
    db.delete(farm)
    db.commit()
