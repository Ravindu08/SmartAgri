from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_land_owner, get_db
from app.schemas.crop import CropCreate, CropRead, CropUpdate
from app.services.crop_service import (
    create_crop,
    delete_crop,
    get_crop_by_owner,
    get_crops_by_farm,
    get_crops_by_owner,
    update_crop,
)

router = APIRouter(prefix="/api", tags=["crops"])


@router.post("/crops", response_model=CropRead, status_code=status.HTTP_201_CREATED)
def create_crop_endpoint(
    payload: CropCreate,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> CropRead:
    try:
        return create_crop(db, payload, owner_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/crops", response_model=list[CropRead])
def list_crops(
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> list[CropRead]:
    return get_crops_by_owner(db, owner_id=current_user.id)


@router.get("/crops/{crop_id}", response_model=CropRead)
def get_crop(
    crop_id: UUID,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> CropRead:
    crop = get_crop_by_owner(db, crop_id=crop_id, owner_id=current_user.id)
    if crop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop not found")
    return crop


@router.put("/crops/{crop_id}", response_model=CropRead)
def update_crop_endpoint(
    crop_id: UUID,
    payload: CropUpdate,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> CropRead:
    crop = get_crop_by_owner(db, crop_id=crop_id, owner_id=current_user.id)
    if crop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop not found")
    return update_crop(db, crop, payload)


@router.delete("/crops/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop_endpoint(
    crop_id: UUID,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> None:
    crop = get_crop_by_owner(db, crop_id=crop_id, owner_id=current_user.id)
    if crop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop not found")
    delete_crop(db, crop)


@router.get("/farms/{farm_id}/crops", response_model=list[CropRead])
def get_farm_crops(
    farm_id: UUID,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> list[CropRead]:
    return get_crops_by_farm(db, farm_id=farm_id, owner_id=current_user.id)
