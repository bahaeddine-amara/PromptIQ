# Import all models here so SQLAlchemy registers them before create_all()
from app.models.user import User        # noqa: F401
from app.models.prompt import Prompt    # noqa: F401
from app.models.ai_model import AIModel # noqa: F401