from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from config import CORS_RIGINS

from database import Base, engine
from routers import auth, presence, person

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="People CRUD with Simple Auth",
    description="API REST para gerenciamento de pessoas com autenticação JWT",
    version="1.0.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(person.router)
app.include_router(presence.router)


@app.get("/")
def root():
    """Endpoint raiz"""
    return {"message": "People CRUD API", "docs": "/docs", "redoc": "/redoc"}


def main():
    """Função principal para executar o servidor"""
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
