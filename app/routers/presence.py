from typing import Any, List
from fastapi import APIRouter, Depends

# from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from models import PersonDB, PresenceDB, UserDB
from schemas import PresenceCreate, PresenceRead
from security import get_current_user
from database import get_db


router = APIRouter(prefix="/presence", tags=["presence"])


@router.post("", response_model=PresenceRead, status_code=201)
def create_presence(
    data_in: PresenceCreate,
    session: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    presence = PresenceDB(
        week=data_in.week,
        present=data_in.present,
        person_id=data_in.person_id,
        owner_id=current_user.id,
    )

    session.add(presence)
    session.commit()
    session.refresh(presence)
    return presence


@router.get("/old", response_model=List[PresenceRead])
def list_presences(
    current_user: UserDB = Depends(get_current_user), session: Session = Depends(get_db)
):
    """
    Lista todas as pessoas presentes do usuário autenticado
    """
    dados = session.query(PresenceDB).all()

    return dados


@router.get("/{semana}", response_model=None)
def list_presences(semana: int,
    current_user: UserDB = Depends(get_current_user), session: Session = Depends(get_db)
):
    """
    Lista todas as pessoas presentes do usuário autenticado nas 4 semanas anteriores, mais a atual

    """

    semana_start:int = semana -4
    semana_start = 1 if semana < 0 else 48 if semana > 48 else semana_start

    person = session.query(PersonDB).filter(PersonDB.owner_id == current_user.id).all()
    presence = session.query(PresenceDB).filter(PresenceDB.week >= semana_start, PresenceDB.week <= semana, PresenceDB.owner_id == current_user.id).all()

    dados = {}

    dados["person"] = person
    dados["presence"] = presence

    return dados
