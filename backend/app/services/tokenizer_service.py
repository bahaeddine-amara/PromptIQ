import tiktoken
from typing import Dict, List

class TokenizerService:
    def __init__(self):
        self.encoder = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str, model: str) -> int:
        base = len(self.encoder.encode(text))
        m = model.lower()
        if "claude" in m:
            return int(base * 1.05)
        elif "gemini" in m:
            return int(base * 1.10)
        elif "llama" in m or "groq" in m:
            return int(base * 0.95)
        return base   # GPT and default

    def count_all(self, text: str, models: List[dict]) -> Dict[str, int]:
        return {m["model_name"]: self.count_tokens(text, m["model_name"]) for m in models}

tokenizer_service = TokenizerService()