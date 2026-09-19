from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, auth

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get('/stats')
def stats(db: Session = Depends(auth.get_db), current_user=Depends(auth.get_current_user)):
    return crud.get_dashboard_stats(db, current_user)
