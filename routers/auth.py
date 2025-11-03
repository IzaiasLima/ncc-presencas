from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
from models import UserDB
from schemas import UserCreate, Token
from security import (
    get_current_user,
    get_password_hash,
    verify_password,
    create_access_token,
)

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


@router.put("/password/{user_id}", response_class=JSONResponse)
def renew_password(
    user_in: UserCreate,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    """
    Atualiza senha de usuário.
    Precisa ter presmissão de Administrador.

    - **email**: email do usuário (deve existir)
    - **password**: nova senha do usuário
    """

    if not current_user.isAdmin():
        raise HTTPException(status_code=401, detail="Insufficient credentials")

    user = db.query(UserDB).filter(UserDB.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email != user.email:
        raise HTTPException(status_code=404, detail="Invalid user_id or email")

    if user_in.password is not None:
        user.password = user_in.password

    db.commit()
    db.refresh(user)

    return JSONResponse(status.HTTP_202_ACCEPTED)


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
