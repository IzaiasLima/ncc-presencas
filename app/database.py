# database.py
"""
Configuração do banco de dados SQLAlchemy
"""
# import os
# from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL


# TURSO_DATABASE_URL = load_dotenv("TURSO_DATABASE_URL")
# TURSO_AUTH_TOKEN = load_dotenv("TURSO_AUTH_TOKEN")

# engine = create_engine(
#     f"sqlite+{TURSO_DATABASE_URL}?secure=true",
#     connect_args={
#         "auth_token": TURSO_AUTH_TOKEN,
#     },
# )

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    """Dependency para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
