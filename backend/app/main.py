from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.database import engine, Base
from app.models import User, Prompt, AIModel  # noqa: F401
from app.routers import auth, prompts, models as models_router

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PromptIQ API",
    description="Intelligent Prompt Engineering Assistant",
    version="2.0.0",
)

# Local dev / thesis project — the extension's content script fetches
# as the PAGE origin (https://chatgpt.com, https://claude.ai, etc.),
# not chrome-extension://, so allowlisting specific origins is brittle.
# allow_credentials=False here because Authorization headers (Bearer
# tokens) are NOT the same as CORS "credentials" (cookies/HTTP auth) —
# we don't need the credentials flag, which lets us safely use "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/v1/auth",    tags=["auth"])
app.include_router(prompts.router,       prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(models_router.router, prefix="/api/v1/models",  tags=["models"])

@app.get("/")
def root():
    return {"message": "PromptIQ API v2.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}