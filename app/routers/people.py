# routers/people.py
"""
Rotas CRUD para gerenciamento de pessoas
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import UserDB, PersonDB
from schemas import PersonCreate, PersonRead, PersonUpdate
from security import get_current_user

router = APIRouter(prefix="/people", tags=["people"])


@router.post("", response_model=PersonRead, status_code=201)
def create_person(
    person_in: PersonCreate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    person = PersonDB(
        name=person_in.name, phone=person_in.phone, owner_id=current_user.id
    )

    try:
        existing_person = (
            db.query(PersonDB)
            .filter(
                PersonDB.name == person_in.name,
                PersonDB.owner_id == current_user.id,
            )
            .first()
        )
        if existing_person:
            raise HTTPException(
                status_code=400, detail="Person with this name already exists"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

    try:
        db.add(person)
        db.commit()
        db.refresh(person)
        return person
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}.")


@router.get("", response_model=List[PersonRead])
def list_people(
    current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Lista todas as pessoas do usuário autenticado
    """
    dados = db.query(PersonDB).filter(PersonDB.owner_id == current_user.id).all()
    print(dados)
    return dados


@router.get("/{person_id}", response_model=PersonRead)
def get_person(
    person_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    dados = get_person(db, person_id, current_user)
    
    # person = (
    #     db.query(PersonDB)
    #     .filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id)
    #     .first()
    # )
    # if not person:
    #     raise HTTPException(status_code=404, detail="Person not found")
    
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


@router.delete("/{person_id}", status_code=204)
def delete_person(
    person_id: int,
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
    db.delete(person)
    db.commit()
    return None

def get_person (db, person_id: int, current_user):
    person = (
        db.query(PersonDB)
        .filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id)
        .first()
    )
     
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person
    