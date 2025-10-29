from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models import PersonDB, PresenceDB, UserDB
from schemas import PresenceCreate, PresenceMatrix, PresenceRead
from security import get_current_user
from database import get_db
from utils import current_week, presence_matrix


router = APIRouter(prefix="/presence", tags=["presence"])


@router.post("", response_model=PresenceRead, status_code=201)
def create_presence(
    data_in: PresenceCreate,
    session: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):

    exists = get_presence(session, data_in)

    if exists:
        exists.present = data_in.present
        presence = exists
    else:
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


@router.get("/{semana}", response_model=None)
def list_presences(
    semana: int,
    current_user: UserDB = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """
    Lista todas as pessoas presentes do usuário autenticado nas 4 semanas anteriores, mais a atual

    """

    semana_start: int = semana - 4
    semana_start = 1 if semana < 0 else 48 if semana > 48 else semana_start

    persons = (
        session.query(PersonDB)
        .filter(PersonDB.owner_id == current_user.id)
        .order_by(PersonDB.name)
        .all()
    )
    presences = (
        session.query(PresenceDB)
        .filter(
            PresenceDB.week >= semana_start,
            PresenceDB.week <= semana,
            PresenceDB.owner_id == current_user.id,
            PresenceDB.present,
        )
        .all()
    )

    dados = {}

    dados["person"] = persons
    dados["presence"] = presences

    # dados = presence_matrix(persons, presences)

    return dados


# @router.get("/{semana}", response_model=PresenceMatrix)
@router.get("/matrix/{week}/{numWeeks}", response_model=None)
def list_presences(
    week: int,
    numWeeks: int,
    current_user: UserDB = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """
    Lista todas as pessoas presentes do usuário autenticado nas 4 semanas anteriores, mais a atual

    """

    numWeeks = max(3, min(numWeeks, 6))
    interval = (numWeeks - 1) if week < numWeeks else -(numWeeks - 1)
    week = current_week() if week == 0 else week
    week_limit = week + interval

    if week > week_limit:
        week_limit, week = week, week_limit

    weeks = [x for x in range(week, week_limit + 1)]

    persons = (
        session.query(PersonDB)
        .filter(PersonDB.owner_id == current_user.id)
        .order_by(PersonDB.name)
        .all()
    )
    presences = (
        session.query(PresenceDB)
        .filter(
            PresenceDB.week >= week,
            PresenceDB.week <= week_limit,
            PresenceDB.owner_id == current_user.id,
            PresenceDB.present,
        )
        .all()
    )

    # dados = {}

    # dados["person"] = persons
    # dados["presence"] = presences

    dados = presence_matrix(persons, presences, weeks)

    return dados


def get_presence(session: Session, presence: PresenceCreate):
    dados = (
        session.query(PresenceDB)
        .filter(
            PresenceDB.person_id == presence.person_id, PresenceDB.week == presence.week
        )
        .first()
    )
    return dados
