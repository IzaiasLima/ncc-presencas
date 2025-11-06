from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import PresenceDB, UserDB, PersonDB
from schemas import PersonCreate, PersonRead, PersonUpdate
from security import get_current_user
from utils import clean_phone, is_blank

router = APIRouter(prefix="/person", tags=["person"])


@router.post("", response_model=PersonRead, status_code=201)
def create_person(
    person_in: PersonCreate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if is_blank(person_in.name) or is_blank(person_in.phone):
        raise HTTPException(status_code=400, detail="Person name ou phone is empty")

    person_in = PersonDB(
        name=person_in.name,
        phone=clean_phone(person_in.phone),
        owner_id=current_user.id,
    )

    try:
        db_person = (
            db.query(PersonDB)
            .filter(
                PersonDB.name == person_in.name,
                PersonDB.owner_id == current_user.id,
            )
            .first()
        )
        if not db_person:
            # cria novo registrp
            db.add(person_in)
            db.commit()
            db.refresh(person_in)
            return person_in
        else:
            # atualiza registro
            db_person.name = person_in.name
            db_person.phone = person_in.phone
            db.commit()
            db.refresh(db_person)
            return db_person

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}.")


@router.get("", response_model=List[PersonRead])
def list_people(
    current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Lista todas as pessoas do usuário autenticado
    """
    dados = db.query(PersonDB).filter(PersonDB.owner_id == current_user.id).all()
    return dados


@router.get("/{person_id}", response_model=PersonRead)
def get_person(
    person_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    dados = get_person(db, person_id, current_user)

    return dados


@router.put("/{person_id}", response_model=PersonRead)
def update_person(
    person_id: int,
    person_in: PersonUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    person = (
        db.query(PersonDB)
        .filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id)
        .first()
    )
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    if person_in.name is not None:
        person.name = person_in.name
    if person_in.phone is not None:
        person.phone = person_in.phone

    db.commit()
    db.refresh(person)
    return person


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(
    person_id: int,
    current_user: UserDB = Depends(get_current_user),
    session: Session = Depends(get_db),
):

    if not current_user.is_admin():
        raise HTTPException(status_code=401, detail="Insufficient credentials")

    if has_presence(session, person_id):
        raise HTTPException(status_code=400, detail="Person has presences")

    person = session.query(PersonDB).filter(PersonDB.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    session.delete(person)
    session.commit()
    return None


def get_person(db, person_id: int, current_user):
    person = (
        db.query(PersonDB)
        .filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id)
        .first()
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


def has_presence(session, id):
    presences = (
        session.query(PresenceDB)
        .join(PersonDB)
        .filter(PresenceDB.person_id == id)
        .all()
    )

    return len(presences) > 0
