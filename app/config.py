# config.py

SECRET_KEY = "replace-this-with-a-random-secret"  # change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*60*24

SQLALCHEMY_DATABASE_URL = "sqlite:///database/ncc.db"

CORS_ORIGINS = ["http://localhost:5500", "http://127.0.0.1:5500"]
