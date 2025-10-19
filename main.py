from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker

# main.py

# ---- Config ----
# Não existe um client-id configurado nesta API.
# O endpoint /token espera apenas email + password
# (no código actual é um JSON {"email": "...", "password": "..."}), 
# cria um JWT e devolve o access_token. Se um cliente OAuth exigir um client_id, 
# ele será ignorado pelo servidor — não há validação nem campo correspondente no código.  

# Uso típico:
# - POST /token com JSON {"email":"you","password":"pwd"} → recebe {"access_token": "..."}  
# - Usar no header: Authorization: Bearer <access_token>

SECRET_KEY = "replace-this-with-a-random-secret"  # change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

SQLALCHEMY_DATABASE_URL = "sqlite:///./db/people.db"

# ---- Database ----
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    people = relationship("PersonDB", back_populates="owner")


class PersonDB(Base):
    __tablename__ = "people"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("UserDB", back_populates="people")


Base.metadata.create_all(bind=engine)

# ---- Schemas ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PersonCreate(BaseModel):
    name: str
    phone: str


class PersonRead(PersonCreate):
    id: int
    owner_id: int

    model_config = ConfigDict(
        from_attributes=True
        # , json_schema_extra={
        #     "example": {
        #         "name": "John Doe",
        #         "age": 30,
        #     }
        # }
    )

    # class Config:
    #     orm_mode = True


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


# ---- Security ----
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# ---- App ----
app = FastAPI(title="People CRUD with Simple Auth (FastAPI + SQLite)")


origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    hashed = get_password_hash(user_in.password)
    user = UserDB(email=user_in.email, hashed_password=hashed)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
def login_for_token(form_data: UserCreate, db: Session = Depends(get_db)):
    # Accepts JSON body: {"email": "...", "password": "..."}
    user = db.query(UserDB).filter(UserDB.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# CRUD endpoints for Person (protected)
@app.post("/people", response_model=PersonRead)
def create_person(person_in: PersonCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    person = PersonDB(name=person_in.name, phone=person_in.phone, owner_id=current_user.id)
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@app.get("/people", response_model=List[PersonRead])
def list_people(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PersonDB).filter(PersonDB.owner_id == current_user.id).all()


@app.get("/people/{person_id}", response_model=PersonRead)
def get_person(person_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    person = db.query(PersonDB).filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@app.put("/people/{person_id}", response_model=PersonRead)
def update_person(person_id: int, person_in: PersonUpdate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    person = db.query(PersonDB).filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    if person_in.name is not None:
        person.name = person_in.name
    if person_in.phone is not None:
        person.phone = person_in.phone
    db.commit()
    db.refresh(person)
    return person


@app.delete("/people/{person_id}", status_code=204)
def delete_person(person_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    person = db.query(PersonDB).filter(PersonDB.id == person_id, PersonDB.owner_id == current_user.id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    db.delete(person)
    db.commit()
    return None

def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
