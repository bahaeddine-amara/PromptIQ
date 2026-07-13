import os
from typing import List, Tuple

CATEGORIES = ["Programming", "Machine Learning", "DevOps", "Writing", "Research", "General"]

KW = {
    "Programming":      ["code", "python", "javascript", "typescript", "function", "class",
                         "api", "debug", "algorithm", "implement", "script", "program",
                         "syntax", "error", "compile", "runtime"],
    "Machine Learning": ["machine learning", "neural network", "model", "training", "dataset",
                         "classification", "regression", "deep learning", "ai", "predict",
                         "feature", "accuracy", "tensorflow", "pytorch", "sklearn",
                         "embedding", "llm", "fine-tune", "transformer"],
    "DevOps":           ["docker", "kubernetes", "deploy", "ci/cd", "pipeline", "server",
                         "container", "cloud", "aws", "nginx", "linux", "bash",
                         "infrastructure", "ansible", "terraform", "helm"],
    "Writing":          ["write", "essay", "article", "blog", "paragraph", "email", "letter",
                         "draft", "grammar", "edit", "proofread", "creative", "story",
                         "content", "copywrite", "headline"],
    "Research":         ["research", "paper", "study", "analysis", "literature", "methodology",
                         "hypothesis", "experiment", "data", "survey", "review", "academic",
                         "citation", "journal"],
}


class ClassificationService:
    def __init__(self):
        self.model     = None
        self.tokenizer = None
        self.loaded    = False
        self._load()

    def _load(self):
        path = "./ml_models/classifier"
        config_path = os.path.join(path, "config.json")

        if not os.path.exists(path) or not os.path.exists(config_path):
            print("⚠️  Classifier not found — using keyword fallback")
            return

        try:
            # Use Auto classes — they read tokenizer_config.json and pick the
            # correct tokenizer/model class automatically, whether fast or slow
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch

            self.tokenizer = AutoTokenizer.from_pretrained(path)
            self.model     = AutoModelForSequenceClassification.from_pretrained(path)
            self.model.eval()
            self.loaded = True
            print("✅ Classifier model loaded")

        except Exception as e:
            print(f"⚠️  Classifier load error: {e}. Using keyword fallback.")

    def _keyword_classify(self, text: str) -> Tuple[str, float]:
        t = text.lower()
        scores = {cat: sum(1 for kw in words if kw in t) for cat, words in KW.items()}
        best = max(scores, key=lambda k: scores[k])
        total = sum(scores.values())
        if total == 0:
            return "General", 0.60
        return best, min(0.97, max(0.55, scores[best] / total))

    def classify(self, text: str) -> Tuple[str, float, List[dict]]:
        if self.loaded and self.model is not None and self.tokenizer is not None:
            try:
                import torch
                enc = self.tokenizer(
                    text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=256,
                    padding=True,
                )
                with torch.no_grad():
                    probs = torch.softmax(self.model(**enc).logits, dim=-1)[0]

                idx = int(torch.argmax(probs).item())
                cat  = CATEGORIES[idx]
                conf = probs[idx].item()
                all_scores = [
                    {"category": CATEGORIES[i], "confidence": round(probs[i].item(), 4)}
                    for i in range(len(CATEGORIES))
                ]
                return cat, conf, all_scores

            except Exception as e:
                print(f"⚠️  Inference error: {e}. Falling back to keywords.")

        cat, conf = self._keyword_classify(text)
        all_scores = [
            {"category": c, "confidence": round(conf if c == cat else 0.05, 4)}
            for c in CATEGORIES
        ]
        return cat, conf, all_scores


classification_service = ClassificationService()