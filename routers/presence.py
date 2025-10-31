from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models import PersonDB, PresenceDB, UserDB
from schemas import PresenceCreate, PresenceMatrix, PresenceRead
from security import get_current_user
from database import get_db
from utils import current_week, build_presence_matrix


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
    Lista todas as pessoas geridas pelo usuário autenticado
    presenças na lsemana selecionada.

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
        )
        .all()
    )

    dados = {}

    dados["person"] = persons
    dados["presence"] = presences

    return dados


@router.get("/person/{id}", response_model=None)
def list_presences_by_person(
    id: int,
    current_user: UserDB = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """
    Lista as presenças de uma pessoa nas últimas semanas.

    """

    semana_last = current_week()
    semana_start = semana_last - 9
    semana_start = max(1, min(semana_start, 44))

    weeks = [x for x in range(semana_start, semana_last + 1)]

    person = (
        session.query(PersonDB)
        .filter(PersonDB.owner_id == current_user.id, PersonDB.id == id)
        .first()
    )
    presences = (
        session.query(PresenceDB)
        .join(PersonDB)
        .filter(
            PresenceDB.week >= semana_start,
            PresenceDB.week <= semana_last,
            PresenceDB.present == True,
            PresenceDB.person_id == id,
            PresenceDB.owner_id == current_user.id,
        )
        .order_by(PresenceDB.week)
        .all()
    )

    week_presences = []
    presence = None
    qtd_weeks = 0

    for w in weeks:
        week_presences.append({"week": w, "present": False})

        for p in presences:
            if p.week == w:
                week_presences[-1] = p
                qtd_weeks += 1
                break

    dados = {}
    dados["qtdWeeks"] = qtd_weeks
    dados["moreThanOne"] = qtd_weeks > 1
    dados["person"] = person
    dados["presences"] = week_presences

    return dados


@router.get("/{week}/{num_weeks}", response_model=PresenceMatrix)
def list_presences(
    week: int,
    num_weeks: int,
    current_user: UserDB = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """
    Lista todas as pessoas geridas pelo usuário autenticado
    presenças de na lista de semanas selecionadas.

    """

    dados = get_presences_matrix(week, num_weeks, None, current_user, session)
    return dados


def get_presences_matrix(
    week: int,
    numWeeks: int,
    person_id: int,
    current_user: UserDB = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """
    Obtém as pessoas geridas pelo usuário autenticado
    presenças de na lista de semanas selecionadas
    ou apenas de uma pessoa, se o id for informado.

    """
    numWeeks = max(3, min(numWeeks, 6))
    interval = (numWeeks - 1) if week < numWeeks else -(numWeeks - 1)
    week = current_week() if week == 0 else week
    week_limit = week + interval

    if week > week_limit:
        week_limit, week = week, week_limit

    weeks = [x for x in range(week, week_limit + 1)]

    persons = None

    if person_id:
        persons = (
            session.query(PersonDB)
            .filter(PersonDB.owner_id == current_user.id, PersonDB.id == person_id)
            .order_by(PersonDB.name)
            .all()
        )
    else:
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
    dados = build_presence_matrix(persons, presences, weeks)
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
