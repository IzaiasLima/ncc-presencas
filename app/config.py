# config.py
import os
from dotenv import load_dotenv
from pathlib import Path

# Caminho para o arquivo .env um nível acima do script atual
# env_path = Path('..') / '.env_exemplo'
# load_dotenv(dotenv_path=env_path)

load_dotenv() 

ALGORITHM = "HS256"
SECRET_KEY =  os.getenv("JWT_SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = 60*60*24

CORS_ORIGINS = os.getenv("CORS_ORIGINS")

DATABASE_URL = os.getenv("DATABASE_URL")
AUTH_TOKEN = os.getenv("DB_AUTH_TOKEN")
