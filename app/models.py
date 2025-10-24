# models.py
"""
Modelos de banco de dados SQLAlchemy
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import relationship
from .database import Base


class UserDB(Base):
    """Modelo de usuário"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    person = relationship("PersonDB", back_populates="owner")


class PersonDB(Base):
    """Modelo de pessoa"""

    __tablename__ = "person"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("UserDB", back_populates="person")
    presence = relationship("PresenceDB", back_populates="person")


class PresenceDB(Base):
    """Modelo de presenca"""

    __tablename__ = "presence"

    id = Column(Integer, primary_key=True, index=True)
    week = Column(Integer, nullable=False)
    present = Column(Boolean, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    person_id = Column(Integer, ForeignKey("person.id"))
    person = relationship("PersonDB", back_populates="presence")
