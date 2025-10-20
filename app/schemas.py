# schemas.py
"""
Schemas Pydantic para validação de dados
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserCreate(BaseModel):
    """Schema para criação de usuário"""

    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema para token de autenticação"""

    access_token: str
    token_type: str = "bearer"


class PersonCreate(BaseModel):
    """Schema para criação de pessoa"""

    name: str
    phone: str


class PersonRead(PersonCreate):
    """Schema para leitura de pessoa"""

    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)


class PersonUpdate(BaseModel):
    """Schema para atualização de pessoa"""

    name: Optional[str] = None
    phone: Optional[str] = None


class PresenceCreate(BaseModel):
    """Schema para criação de presencas"""

    key: str
    present: bool


class PresenceRead(PresenceCreate):
    """Schema para leitura de pessoa"""

    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)
