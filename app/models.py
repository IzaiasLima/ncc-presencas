# models.py
"""
Modelos de banco de dados SQLAlchemy
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import relationship
from database import Base


class UserDB(Base):
    """Modelo de usuário"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    people = relationship("PersonDB", back_populates="owner")


class PersonDB(Base):
    """Modelo de pessoa"""

    __tablename__ = "people"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("UserDB", back_populates="people")


class PresenceDB(Base):
    """Modelo de presenca"""

    __tablename__ = "presence"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False)
    present = Column(Boolean, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    # owner = relationship("UserDB", back_populates="people")
