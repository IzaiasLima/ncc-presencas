# config.py
import os

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*60*24

CORS_ORIGINS = ["http://localhost:5500", "http://127.0.0.1:5500"]

SECRET_KEY =  os.environ.get("SECRET_KEY", "replace-this-with-a-random-secret")
# DB_SECRET_TOKEN = os.environ.get("DB_SECRET_TOKEN", "token-do-sqlite-turso-service")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///database/ncc.db")

# DB_TOKEN = os.environ.get("DB_SECRET_TOKEN")
# DB_URL = os.environ.get("DATABASE_URL")