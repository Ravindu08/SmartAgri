from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_land_owner, get_db
from app.schemas.farm import FarmCreate, FarmRead, FarmUpdate
from app.services.farm_service import (
    create_farm,
    delete_farm,
    get_farm_by_owner,
    get_farms_by_owner,
    update_farm,
)
from app.utils.image_storage import ImageTooLargeError

router = APIRouter(prefix="/api/farms", tags=["farms"])


@router.post("", response_model=FarmRead, status_code=status.HTTP_201_CREATED)
def create_farm_endpoint(
    payload: FarmCreate,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> FarmRead:
    try:
        farm = create_farm(db, payload, owner_id=current_user.id)
    except ImageTooLargeError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc
    return farm


@router.get("", response_model=list[FarmRead])
def list_farms(
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> list[FarmRead]:
    return get_farms_by_owner(db, owner_id=current_user.id)


@router.get("/{farm_id}", response_model=FarmRead)
def get_farm(
    farm_id: UUID,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> FarmRead:
    farm = get_farm_by_owner(db, farm_id=farm_id, owner_id=current_user.id)
    if farm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return farm


@router.put("/{farm_id}", response_model=FarmRead)
def update_farm_endpoint(
    farm_id: UUID,
    payload: FarmUpdate,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> FarmRead:
    farm = get_farm_by_owner(db, farm_id=farm_id, owner_id=current_user.id)
    if farm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    try:
        return update_farm(db, farm, payload)
    except ImageTooLargeError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm_endpoint(
    farm_id: UUID,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> None:
    farm = get_farm_by_owner(db, farm_id=farm_id, owner_id=current_user.id)
    if farm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    delete_farm(db, farm)
