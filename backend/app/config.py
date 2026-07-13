from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:yourpassword@localhost:3306/promptiq"

    # JWT
    SECRET_KEY: str = "d30e0fcd42ba4b3703432a6e944fae67595987fe1d49b40856ab8d0c54c5956a"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Groq
    GROQ_API_KEY: str = "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"

    # ML Model Paths
    CLASSIFIER_MODEL_PATH: str = "./ml_models/classifier"
    SCORER_MODEL_PATH: str = "./ml_models/scorer/xgboost_scorer.json"
    SCORER_SCALER_PATH: str = "./ml_models/scorer/scaler.pkl"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()