from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, auth

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get('/', response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('admin'))):
    return crud.get_users(db)

@router.get('/me', response_model=schemas.UserOut)
def me(current_user=Depends(auth.get_current_user)):
    return current_user

@router.put('/me', response_model=schemas.UserOut)
def update_me(data: schemas.UserUpdate, db: Session = Depends(auth.get_db), current_user=Depends(auth.get_current_user)):
    updated = crud.update_user_profile(db, current_user.id, full_name=data.full_name, password=data.password)
    if not updated:
        raise HTTPException(status_code=404, detail='User not found')
    return updated

@router.delete('/{user_id}')
def delete_user(user_id: int, db: Session = Depends(auth.get_db), current_user=Depends(auth.require_role('admin'))):
    ok = crud.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail='User not found')
    return {"deleted": True}
