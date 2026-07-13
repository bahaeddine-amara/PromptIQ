from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.prompt import Prompt
from app.schemas.prompt import (AnalyzeRequest, OptimizeRequest, 
                                 AnalyzeResponse, OptimizeResponse, PromptHistoryItem)
from app.core.dependencies import get_current_user
from app.services.classification_service import classification_service
from app.services.scoring_service import scoring_service
from app.services.tokenizer_service import tokenizer_service
from app.services.optimization_service import optimization_service

router = APIRouter() # <--- THIS WAS MISSING

MODEL_PRICES = {
    "gpt-4o":            {"input": 2.50,  "output": 10.00},
    "gpt-4o-mini":       {"input": 0.15,  "output": 0.60},
    "gpt-3.5-turbo":     {"input": 0.50,  "output": 1.50},
    "claude-3-5-sonnet": {"input": 3.00,  "output": 15.00},
    "claude-3-haiku":    {"input": 0.25,  "output": 1.25},
    "gemini-1.5-pro":    {"input": 1.25,  "output": 5.00},
    "gemini-1.5-flash":  {"input": 0.075, "output": 0.30},
    "llama-3.3-70b":     {"input": 0.59,  "output": 0.79},
}

CATEGORY_MODEL_MAP = {
    "Programming":       "gpt-4o",
    "Machine Learning":  "gpt-4o",
    "DevOps":            "claude-3-5-sonnet",
    "Writing":           "claude-3-5-sonnet",
    "Research":          "claude-3-5-sonnet",
    "General":           "gpt-4o-mini",
}

def calc_cost(tokens: int, model: str) -> float:
    p = MODEL_PRICES.get(model, {"input": 1.0})
    return (tokens / 1_000_000) * p["input"]


# ─── PUBLIC endpoint ───────────────────────────────────────────────────────────
@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_prompt(req: AnalyzeRequest, db: Session = Depends(get_db)):
    # 1. Classify
    category, confidence, _ = classification_service.classify(req.prompt)

    # 2. Score
    result = scoring_service.score(req.prompt)

    # 3. Token counts for all models
    token_counts = [
        {"model": m, "tokens": (t := tokenizer_service.count_tokens(req.prompt, m)),
         "cost": round(calc_cost(t, m), 8)}
        for m in MODEL_PRICES
    ]

    recommended = CATEGORY_MODEL_MAP.get(category, "gpt-4o-mini")

    return {
        "category":          category,
        "quality_score":     result["score"],
        "grade":             result["grade"],
        "features":          result["features"],
        "token_counts":      token_counts,
        "recommendations":   result["recommendations"],
        "recommended_model": recommended,
    }


# ─── AUTH-REQUIRED endpoints ──────────────────────────────────────────────────
@router.post("/optimize", response_model=OptimizeResponse)
def optimize_prompt(req: OptimizeRequest,
                    current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    opt = optimization_service.optimize(req.prompt, req.mode)
    if not opt["success"]:
        raise HTTPException(status_code=500, detail=opt.get("error", "Optimization failed"))

    optimized = opt["optimized_prompt"]

    # Quick analysis on both versions
    category, _, _ = classification_service.classify(req.prompt)
    sc_result       = scoring_service.score(req.prompt)
    recommended     = CATEGORY_MODEL_MAP.get(category, "gpt-4o-mini")

    tb = tokenizer_service.count_tokens(req.prompt, "gpt-4o")
    ta = tokenizer_service.count_tokens(optimized,  "gpt-4o")
    cb = calc_cost(tb, "gpt-4o")
    ca = calc_cost(ta, "gpt-4o")
    savings = round(((tb - ta) / max(tb, 1)) * 100, 1)

    db.add(Prompt(
        user_id           = current_user.id,
        original_prompt   = req.prompt,
        optimized_prompt  = optimized,
        category          = category,
        quality_score     = sc_result["score"],
        tokens_before     = tb,
        tokens_after      = ta,
        cost_before       = round(cb, 8),
        cost_after        = round(ca, 8),
        recommended_model = recommended,
        optimization_mode = req.mode,
    ))
    db.commit()

    return {
        "original_prompt":  req.prompt,
        "optimized_prompt": optimized,
        "mode":             req.mode,
        "tokens_before":    tb,
        "tokens_after":     ta,
        "cost_before":      round(cb, 8),
        "cost_after":       round(ca, 8),
        "savings_percent":  savings,
    }


@router.get("/history", response_model=List[PromptHistoryItem])
def get_history(current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db),
                limit: int = 30):
    return (db.query(Prompt)
              .filter(Prompt.user_id == current_user.id)
              .order_by(Prompt.created_at.desc())
              .limit(limit)
              .all())