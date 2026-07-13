from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.database import engine, Base
# Import models so SQLAlchemy registers their tables
from app.models import User, Prompt, AIModel  # noqa: F401
from app.routers.auth import router as auth_router
from app.routers.prompts import router as prompts_router
from app.routers.models import router as models_router

logging.basicConfig(level=logging.INFO)

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PromptIQ API",
    description="Intelligent Prompt Engineering Assistant",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,    prefix="/api/v1/auth",    tags=["auth"])
app.include_router(prompts_router, prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(models_router,  prefix="/api/v1/models",  tags=["models"])

@app.get("/")
def root():
    return {"message": "PromptIQ API v2.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}