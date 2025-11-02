from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
from models import UserDB
from schemas import UserCreate, Token
from security import get_password_hash, verify_password, create_access_token

router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário

    - **email**: email do usuário (deve ser único)
    - **password**: senha do usuário

    Retorna um token JWT para uso imediato
    """
    hashed = get_password_hash(user_in.password)
    user = UserDB(email=user_in.email, hashed_password=hashed)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except (IntegrityError, ValueError):
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
def login_for_token(form_data: UserCreate, db: Session = Depends(get_db)):
    """
    Realiza login e retorna token JWT

    Aceita JSON: {"email": "...", "password": "..."}
    Retorna: {"access_token": "...", "token_type": "bearer"}

    Use o token no header: Authorization: Bearer <access_token>
    """
    user = db.query(UserDB).filter(UserDB.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
