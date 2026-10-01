from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, crud, auth

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get('/', response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(auth.get_db)):
    return crud.list_categories(db)

@router.post('/', response_model=schemas.CategoryOut)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('admin'))):
    return crud.create_category(db, cat.name, cat.description)

@router.put('/{category_id}', response_model=schemas.CategoryOut)
def update_category(category_id: int, cat: schemas.CategoryUpdate, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('admin'))):
    updated = crud.update_category(db, category_id, cat.name, cat.description)
    if not updated:
        raise HTTPException(status_code=404, detail='Category not found')
    return updated

@router.delete('/{category_id}')
def delete_category(category_id: int, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('admin'))):
    ok = crud.delete_category(db, category_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Category not found')
    return {"deleted": True}
