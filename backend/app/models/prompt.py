from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Prompt(Base):
    __tablename__ = "prompts"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id"), nullable=True)
    original_prompt    = Column(Text, nullable=False)
    optimized_prompt   = Column(Text, nullable=True)
    category           = Column(String(50), nullable=True)
    quality_score      = Column(Float, nullable=True)
    tokens_before      = Column(Integer, nullable=True)
    tokens_after       = Column(Integer, nullable=True)
    cost_before        = Column(Float, nullable=True)
    cost_after         = Column(Float, nullable=True)
    recommended_model  = Column(String(100), nullable=True)
    optimization_mode  = Column(String(20), nullable=True)
    created_at         = Column(DateTime, server_default=func.now())