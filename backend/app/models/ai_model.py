from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class AIModel(Base):
    __tablename__ = "ai_models"

    id             = Column(Integer, primary_key=True, index=True)
    provider       = Column(String(50))
    model_name     = Column(String(100), unique=True, index=True)
    input_price    = Column(Float)   # per 1M tokens USD
    output_price   = Column(Float)   # per 1M tokens USD
    overall_score  = Column(Float)
    coding_score   = Column(Float)
    research_score = Column(Float)
    writing_score  = Column(Float)