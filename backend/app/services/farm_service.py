from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate
from app.utils.image_storage import store_image


def create_farm(db: Session, farm_in: FarmCreate, owner_id: int) -> Farm:
    farm = Farm(
        farm_name=farm_in.farm_name,
        location=farm_in.location,
        district=farm_in.district,
        farm_size=farm_in.farm_size,
        size_unit=farm_in.size_unit,
        soil_type=farm_in.soil_type,
        irrigation_type=farm_in.irrigation_type,
        cultivated_crops=farm_in.cultivated_crops,
        season=farm_in.season,
        image_data=store_image(farm_in.image_data),
        owner_id=owner_id,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


def get_farms_by_owner(db: Session, owner_id: int) -> list[Farm]:
    return db.execute(
        select(Farm).where(Farm.owner_id == owner_id).order_by(Farm.created_at.desc())
    ).scalars().all()


def get_farm_by_owner(db: Session, farm_id: UUID, owner_id: int) -> Farm | None:
    return db.execute(
        select(Farm).where(Farm.id == farm_id, Farm.owner_id == owner_id)
    ).scalar_one_or_none()


def update_farm(db: Session, farm: Farm, farm_in: FarmUpdate) -> Farm:
    # Only update fields that were explicitly included in the request payload
    for field in farm_in.model_fields_set:
        value = getattr(farm_in, field)
        if field == "image_data":
            value = store_image(value)
        setattr(farm, field, value)

    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


def delete_farm(db: Session, farm: Farm) -> None:
    db.delete(farm)
    db.commit()
