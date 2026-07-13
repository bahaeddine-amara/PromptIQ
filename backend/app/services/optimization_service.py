from groq import Groq
from app.config import settings

SYSTEM_PROMPTS = {
    "PERFORMANCE": """You are a world-class prompt engineer.
Rewrite the user's prompt to be dramatically more effective by:
1. Adding a clear expert role definition if missing
2. Specifying exact output format (JSON, markdown, code, etc.)
3. Adding relevant constraints and requirements
4. Using precise action verbs and specific details
5. Including context about the use case

Return ONLY the rewritten prompt. No explanations, no preamble.""",

    "ECONOMY": """You are a token optimization expert.
Compress the user's prompt to use the fewest tokens possible while preserving 100% of the intent.
- Remove filler words, redundancy, and unnecessary politeness
- Keep all technical details, constraints, and requirements
- Use abbreviations where safe (e.g. JSON, API, etc.)

Return ONLY the compressed prompt. No explanations.""",
}

class OptimizationService:
    def __init__(self):
        self.client = None
        self.model  = "llama-3.3-70b-versatile"
        if settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
            print("✅ Groq client initialized")
        else:
            print("⚠️  GROQ_API_KEY not set — optimization disabled")

    def optimize(self, prompt: str, mode: str = "PERFORMANCE") -> dict:
        if not self.client:
            return {"optimized_prompt": prompt, "success": False,
                    "error": "GROQ_API_KEY not configured in .env"}
        sys_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["PERFORMANCE"])
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
            )
            content = resp.choices[0].message.content
            return {"optimized_prompt": content.strip() if content else prompt, "success": True}
        except Exception as e:
            return {"optimized_prompt": prompt, "success": False, "error": str(e)}

optimization_service = OptimizationService()