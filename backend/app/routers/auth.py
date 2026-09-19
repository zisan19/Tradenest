from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from .. import schemas, crud, auth

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post('/register', response_model=schemas.UserOut)
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    auth._enforce_rate_limit(request)
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    new_user = crud.create_user(db, user)
    return new_user


@router.post('/login', response_model=schemas.Token)
def login(request: Request, form_data: schemas.UserLogin, db: Session = Depends(auth.get_db)):
    auth._enforce_rate_limit(request)
    user = crud.get_user_by_email(db, form_data.email)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        # track failed attempts
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            user.last_failed_login = datetime.utcnow()
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # reset failed attempts on successful login
    if user.failed_login_attempts:
        user.failed_login_attempts = 0
        user.last_failed_login = None
        db.commit()

    access_token = auth.create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "email": user.email,
    })
    refresh_token, jti, expires = auth.create_refresh_token({"sub": str(user.id)})
    # persist the refresh token jti for rotation and revocation
    crud.create_refresh_token_entry(db, user.id, jti, expires)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post('/refresh', response_model=schemas.Token)
def refresh_token(body: schemas.TokenRefresh, db: Session = Depends(auth.get_db)):
    info = auth.get_current_user_from_refresh(body.refresh_token)
    if not info:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    existing = crud.get_refresh_token(db, info['jti'])
    if not existing or existing.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked or unknown")
    # rotate: revoke old, issue new
    crud.revoke_refresh_token(db, info['jti'])
    user = crud.get_user(db, user_id=info['user_id'])
    role = user.role if user else "buyer"
    email = user.email if user else ""
    access_token = auth.create_access_token({"sub": str(info['user_id']), "role": role, "email": email})
    new_refresh_token, new_jti, expires = auth.create_refresh_token({"sub": str(info['user_id'])})
    crud.create_refresh_token_entry(db, info['user_id'], new_jti, expires)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post('/logout')
def logout(body: schemas.TokenRefresh, db: Session = Depends(auth.get_db)):
    info = auth.get_current_user_from_refresh(body.refresh_token)
    if not info:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    crud.revoke_refresh_token(db, info['jti'])
    return {"ok": True}
