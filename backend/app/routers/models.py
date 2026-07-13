from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ai_model import AIModel

router = APIRouter()

@router.get("/")
def get_models(db: Session = Depends(get_db)):
    return db.query(AIModel).all()