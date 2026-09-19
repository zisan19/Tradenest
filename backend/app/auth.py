import os
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict
from uuid import uuid4
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from . import crud, models
from .database import SessionLocal

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "tradenest-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", 60 * 24 * 30))
REFRESH_TOKEN_SECRET = os.getenv("REFRESH_TOKEN_SECRET", SECRET_KEY)

RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 60))
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", 60))
rate_limit_state: dict[str, list[float]] = defaultdict(list)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def _enforce_rate_limit(request: Request):
    ip_address = request.client.host if request.client else "anonymous"
    key = f"{ip_address}:{request.url.path}"
    now = datetime.utcnow().timestamp()
    window = rate_limit_state[key]
    # remove stale entries
    window[:] = [stamp for stamp in window if now - stamp < RATE_LIMIT_WINDOW]
    if len(window) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests, please try again later.")
    window.append(now)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    # Generate a unique token identifier (jti) so we can persist/rotate
    jti = str(uuid4())
    to_encode.update({"jti": jti})
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, REFRESH_TOKEN_SECRET, algorithm=ALGORITHM)
    return token, jti, expire


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        try:
            user_id = int(user_id)
        except Exception:
            pass
    except JWTError:
        raise credentials_exception
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise credentials_exception
    return user


def get_current_user_from_refresh(token: str):
    try:
        payload = jwt.decode(token, REFRESH_TOKEN_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        jti = payload.get("jti")
        if user_id is None or jti is None:
            return None
        try:
            user_id = int(user_id)
        except Exception:
            pass
        return {"user_id": user_id, "jti": jti}
    except JWTError:
        return None


def require_role(role: str):
    def _require_role(current_user: models.User = Depends(get_current_user)):
        if current_user.role != role and current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted")
        return current_user
    return _require_role
