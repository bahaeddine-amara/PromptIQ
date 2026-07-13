from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AnalyzeRequest(BaseModel):
    prompt: str

class OptimizeRequest(BaseModel):
    prompt: str
    mode: str = "PERFORMANCE"  # ECONOMY or PERFORMANCE

class TokenCount(BaseModel):
    model: str
    tokens: int
    cost: float

class AnalyzeResponse(BaseModel):
    category: str
    quality_score: float
    grade: str
    features: Dict[str, Any]
    token_counts: List[TokenCount]
    recommendations: List[str]
    recommended_model: str

class OptimizeResponse(BaseModel):
    original_prompt: str
    optimized_prompt: str
    mode: str
    tokens_before: int
    tokens_after: int
    cost_before: float
    cost_after: float
    savings_percent: float

class PromptHistoryItem(BaseModel):
    id: int
    original_prompt: str
    optimized_prompt: Optional[str]
    category: Optional[str]
    quality_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True