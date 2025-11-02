from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL, AUTH_TOKEN

engine = create_engine(
    f"{DATABASE_URL}?secure=true",
    echo=True,
    connect_args={
        "auth_token": AUTH_TOKEN,
        "check_same_thread": False,
    },
)

# engine = create_engine("./local_db/ncc.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    """Dependency para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
