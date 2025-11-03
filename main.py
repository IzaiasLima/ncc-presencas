from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS

from database import Base, engine
from routers import auth, presence, person

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="API Simples para Resgistro de Presenças",
    description="API REST para registrar a presença de pessoas no NCC",
    version="1.0.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(person.router)
app.include_router(presence.router)


app.mount("/p", StaticFiles(directory="static", html="True"), name="static")


@app.get("/", response_class=RedirectResponse)
def root():
    return "/p/pages/login.html"


def main():
    """Função principal para executar o servidor"""
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
