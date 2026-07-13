import re
import os
import numpy as np
from typing import Dict, List

SPECIFIC_VERBS = [
    "implement", "create", "build", "write", "design", "analyze",
    "explain", "compare", "generate", "convert", "optimize", "fix",
    "debug", "refactor", "test", "review", "summarize", "translate"
]

ACTION_VERBS = [
    "create", "build", "write", "make", "help", "generate", "develop", 
    "design", "construct", "formulate", "draft", "evaluate", "assess", 
    "transform", "implement", "code", "debug", "refactor", "analyze", 
    "explain", "compare", "optimize", "fix", "test", "review", "summarize"
]


def _count_syllables(word: str) -> int:
    word = word.lower()
    count, prev_vowel = 0, False
    for ch in word:
        v = ch in "aeiou"
        if v and not prev_vowel:
            count += 1
        prev_vowel = v
    return max(1, count)

def _detect_background(text: str) -> float:
    """Context-aware background detection. Returns 1.0 if project context/narrative is found."""
    t = text.lower().strip()
    if not t:
        return 0.0

    # 1. Explicit context markers (Direct statements of what they are working on)
    explicit_patterns = [
        r"\b(?:i\s+am|i'm|we\s+are|we're)\s+(?:building|developing|creating|working\s+on|making|designing)\b",
        r"\bmy\s+(?:app|project|website|code|system|platform|bot|api|database)\b",
        r"\b(?:context|background|project|goal|objective|scenario)\s*(?::|is)\b",
    ]
    if any(re.search(pat, t) for pat in explicit_patterns):
        return 1.0

    # 2. Intent/Goal framing (Implies they are explaining the 'why' or 'what for')
    intent_patterns = [
        r"\b(?:trying\s+to|aim\s+to|goal\s+is\s+to|objective\s+is\s+to|i\s+(?:want|need)\s+to)\b",
        r"\bin\s+order\s+to\b",
        r"\bso\s+that\s+i\s+(?:can|will)\b",
    ]
    if any(re.search(pat, t) for pat in intent_patterns):
        return 1.0

    # 3. Contextual Bridging (Strong indicators that the prompt is grounded in a specific scenario)
    # e.g., "based on historical data", "for my startup", "using our dataset"
    bridging_patterns = [
        r"\bbased\s+on\b",                  # "based on historical data"
        r"\bfor\s+(?:my|our|the|a)\s+(?:new|existing|real|large|small)\b", # "for my new app"
        r"\busing\s+(?:my|our|the|historical|real|live)\s+\w+\b",          # "using my dataset"
        r"\bto\s+help\s+(?:me|us|users|customers|clients)\b",              # "to help users"
    ]
    if any(re.search(pat, t) for pat in bridging_patterns):
        return 1.0

    return 0.0

def extract_features(text: str) -> Dict:
    words = text.split()
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    wc = len(words)
    sc = max(len(sentences), 1)
    
    # Readability calculations
    avg_syllables = sum(_count_syllables(w) for w in words) / max(wc, 1)
    asl = wc / sc
    raw_readability = 206.835 - 1.015 * asl - 84.6 * avg_syllables
    
    t = text.lower()

    return {
        "avg_sentence_length":  asl,
        "avg_word_length":      np.mean([len(w) for w in words]) if words else 0,
        "char_count":           len(text),
        
        # 1. Action Verbs (Broader matching)
        "has_action_verbs":     1 if any(re.search(rf"\b{v}\b", t) for v in ACTION_VERBS) else 0,
        
        # 2. Background/Context (Looks for narrative intent, not just "context:")
        "has_background":       _detect_background(text),
        
        # 3. Bullet Points (Catches markdown, unicode, and newlines)
        "has_bullet_points":    1 if re.search(r"(?:[-*•]\s|\n\s*[-*•]|\n\s*\d+\.)", text) else 0,
        
        # 4. Code Blocks
        "has_code_blocks":      1 if "```" in text or "`" in text else 0,
        
        # 5. Constraints (Catches negative constraints, mandatory rules, and synonyms)
        "has_constraints":      1 if re.search(
            r"\b(?:must|should|cannot|can't|don't|do\s+not|avoid|exclude|ensure|guarantee|strictly|limit\s+to|only\s+use|never|requirement|constraint|make\s+sure|please\s+don't)\b", t
        ) else 0,
        
        # 6. Examples (Catches structural examples and natural phrasing)
        "has_examples":         1 if re.search(
            r"\b(?:example|e\.g\.|for\s+instance|such\s+as|like\s+this|input\s*(?::|:)|output\s*(?::|:)|sample|for\s+example)\b", t
        ) else 0,
        
        # 7. Numbers
        "has_numbers":          1 if re.search(r"\d+", text) else 0,
        
        # 8. Output Format (Catches specific formats like JSON, Markdown, tables, lists)
        "has_output_format":    1 if re.search(
            r"\b(?:return\s+(?:json|xml|csv|markdown|html|a\s+list|a\s+table)|output\s*(?::|format)|format\s*(?::|as)|respond\s+with|provide\s+(?:a|the)\s+(?:json|list|table|markdown)|use\s+(?:markdown|a\s+table|bullet\s+points|json)|as\s+(?:json|a\s+list|markdown))\b", t
        ) else 0,
        
        # 9. Quantifiers
        "has_quantifiers":      len(re.findall(r"\b\d+\b", text)),
        
        # 10. Questions
        "has_questions":        1 if "?" in text else 0,
        
        # 11. Role Definition (The smart context-aware version from before)
        "has_role_definition":  1 if re.search(
            r"\b(?:you(?:'re|re|\s*r)?|u(?:re|'\s*r)?|ure)\s+(?:are\s+)?(?:a|an)\s+|"
            r"\b(?:act|serve|function)\s+(?:as|like)\b|"
            r"\b(?:pretend|imagine)\s+to\s+be\b|"
            r"\b(?:take|assume|play)\s+(?:on\s+)?the\s+role\s+of\b|"
            r"\b(?:be|become)\s+(?:a|an)\b|"
            r"\byour\s+(?:role|job|task|responsibility)\s+is\b", t
        ) else 0,
        
        # 12. Specific Verbs (Count of high-value technical verbs)
        "has_specific_verbs":   sum(1 for v in ACTION_VERBS if re.search(rf"\b{v}\b", t)),
        
        # 13. Structure (Catches steps, phases, and ordered lists)
        "has_structure":        1 if re.search(
            r"\b(?:first|second|third|then|finally|step|phase|part|1\.|2\.|3\.|\n\s*[-*•]|\n\s*\d+\.)", text
        ) else 0,
        
        "readability_score":    float(max(0, min(100, raw_readability))),
        "sentence_count":       float(sc),
        "vocabulary_richness":  len(set(w.lower() for w in words)) / max(wc, 1),
        "word_count":           float(wc),
    }


FEATURE_NAMES = sorted(extract_features("test").keys())


class ScoringService:
    def __init__(self):
        self.model  = None
        self.scaler = None
        self.loaded = False
        self._load()

    def _load(self):
        sp = "./ml_models/scorer/xgboost_scorer.json"
        sc = "./ml_models/scorer/scaler.pkl"
        if os.path.exists(sp) and os.path.exists(sc):
            try:
                import xgboost as xgb
                import joblib
                self.model = xgb.XGBRegressor()
                self.model.load_model(sp)
                self.scaler = joblib.load(sc)
                self.loaded = True
                print("✅ Scoring model loaded")
            except Exception as e:
                print(f"⚠️  Scorer load error: {e}. Using heuristic fallback.")
        else:
            print("⚠️  Scorer not found — using heuristic fallback")

    def _heuristic(self, f: Dict) -> float:
        s = 0.0
        wc = f["word_count"]
        if 20 <= wc <= 60:
            s += 18
        elif 60 < wc <= 200:
            s += 22
        elif wc > 5:
            s += 10
        s += min(f["has_specific_verbs"] * 5, 15)
        s += f["has_examples"] * 6
        s += f["has_role_definition"] * 12
        s += f["has_background"] * 8
        s += f["has_constraints"] * 8
        s += f["has_output_format"] * 10
        s += f["has_bullet_points"] * 5
        s += f["has_numbers"] * 3
        s += f["has_action_verbs"] * 5
        s += min(f["vocabulary_richness"] * 7, 7)
        return float(min(100, max(0, s)))

    def _grade(self, score: float) -> str:
        if score >= 90: return "A+"
        if score >= 85: return "A"
        if score >= 80: return "A-"
        if score >= 75: return "B+"
        if score >= 70: return "B"
        if score >= 65: return "B-"
        if score >= 60: return "C+"
        if score >= 55: return "C"
        if score >= 50: return "C-"
        if score >= 40: return "D"
        return "F"

    def _recommendations(self, f: Dict) -> List[str]:
        recs = []
        if not f["has_role_definition"]:
            recs.append('Add a role definition — e.g. "You are a senior Python developer..."')
        if not f["has_specific_verbs"]:
            recs.append('Use specific action verbs like "implement", "analyze", "optimize"')
        if f["word_count"] < 10:
            recs.append("Your prompt is too short — add more context and detail")
        if not f["has_output_format"]:
            recs.append('Specify output format — e.g. "Return JSON with fields: ..."')
        if not f["has_constraints"]:
            recs.append('Add constraints — e.g. "Must handle edge cases", "Avoid using X"')
        if not f["has_examples"] and f["word_count"] > 20:
            recs.append("Add a few-shot example (input/output pair) for better results")
        if not f["has_background"]:
            recs.append("Provide project context — what are you building?")
        return recs[:4]

    def score(self, text: str) -> Dict:
        features = extract_features(text)

        if self.loaded and self.model is not None and self.scaler is not None:
            try:
                arr = np.array([[features[k] for k in FEATURE_NAMES]])
                arr = self.scaler.transform(arr)
                val = float(self.model.predict(arr)[0])
                val = max(0.0, min(100.0, val))
            except Exception:
                val = self._heuristic(features)
        else:
            val = self._heuristic(features)

        return {
            "score":           round(val, 1),
            "grade":           self._grade(val),
            "features":        features,
            "recommendations": self._recommendations(features),
        }


scoring_service = ScoringService()