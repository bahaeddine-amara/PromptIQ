"""Run once to populate the ai_models table."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.ai_model import AIModel
from app.models import User, Prompt  # noqa: ensure all tables exist

Base.metadata.create_all(bind=engine)

MODELS = [
    dict(provider="OpenAI",      model_name="gpt-4o",            input_price=2.50,  output_price=10.00, overall_score=9.2, coding_score=9.0, research_score=9.3, writing_score=9.2),
    dict(provider="OpenAI",      model_name="gpt-4o-mini",       input_price=0.15,  output_price=0.60,  overall_score=8.5, coding_score=8.3, research_score=8.4, writing_score=8.6),
    dict(provider="OpenAI",      model_name="gpt-3.5-turbo",     input_price=0.50,  output_price=1.50,  overall_score=7.8, coding_score=7.5, research_score=7.8, writing_score=8.0),
    dict(provider="Anthropic",   model_name="claude-3-5-sonnet", input_price=3.00,  output_price=15.00, overall_score=9.3, coding_score=9.1, research_score=9.5, writing_score=9.4),
    dict(provider="Anthropic",   model_name="claude-3-haiku",    input_price=0.25,  output_price=1.25,  overall_score=8.0, coding_score=7.8, research_score=8.1, writing_score=8.2),
    dict(provider="Google",      model_name="gemini-1.5-pro",    input_price=1.25,  output_price=5.00,  overall_score=9.0, coding_score=8.8, research_score=9.1, writing_score=8.9),
    dict(provider="Google",      model_name="gemini-1.5-flash",  input_price=0.075, output_price=0.30,  overall_score=8.2, coding_score=8.0, research_score=8.2, writing_score=8.3),
    dict(provider="Meta/Groq",   model_name="llama-3.3-70b",     input_price=0.59,  output_price=0.79,  overall_score=8.8, coding_score=8.6, research_score=8.9, writing_score=8.7),
]

def seed():
    db = SessionLocal()
    try:
        db.query(AIModel).delete()
        for d in MODELS:
            db.add(AIModel(**d))
        db.commit()
        print(f"✅ Seeded {len(MODELS)} AI models into ai_models table")
    finally:
        db.close()

if __name__ == "__main__":
    seed()