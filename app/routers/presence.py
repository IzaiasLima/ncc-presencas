from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import PersonDB, PresenceDB, UserDB
from schemas import PresenceCreate, PresenceRead
from security import get_current_user
from database import get_db


router = APIRouter(prefix="/presence", tags=["presence"])


@router.post("", response_model=PresenceRead, status_code=201)
def create_presence(
    data_in: PresenceCreate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    presence = PresenceDB(
        key=data_in.key, present=data_in.present, owner_id=current_user.id
    )
    db.add(presence)
    db.commit()
    db.refresh(presence)
    return presence


@router.get("", response_model=List[PresenceRead])
def list_people(
    current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Lista todas as pessoas presentes do usuário autenticado
    """
    dados = db.query(PresenceDB).filter(PersonDB.owner_id == current_user.id).all()
    print(dados)
    return dados
