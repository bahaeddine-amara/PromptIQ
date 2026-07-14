# 🧠 PromptIQ — Intelligent Prompt Engineering Assistant

An end-of-year project (ESPRIT — Data Science & AI Engineering) that analyzes,
scores, and optimizes LLM prompts using a hybrid ML architecture: a fine-tuned
DistilBERT classifier, an XGBoost quality scorer over 20 linguistic features,
real tokenizers for exact token counts, and Groq's Llama 3.3 70B for prompt
rewriting. Includes a full-stack web app and a Chrome extension that works
directly on ChatGPT, Claude, and Gemini.

## Architecture

```
Browser Extension (Chrome MV3)
        │
        ▼
React 18 + TypeScript + Tailwind  ──┐
                                     ├──▶  FastAPI Backend
                                     │        ├── DistilBERT (classification)
                                     │        ├── XGBoost (quality scoring)
                                     │        ├── tiktoken (token counting)
                                     │        └── Groq API (optimization)
                                     │
                              MySQL 8 (Docker)
```

## Stack

| Layer         | Technology                                              |
|---------------|----------------------------------------------------------|
| Backend       | FastAPI, SQLAlchemy, PyMySQL, JWT auth                    |
| Database      | MySQL 8.0 (Docker container)                              |
| ML — classify | DistilBERT, fine-tuned on 6 prompt categories              |
| ML — scoring  | XGBoost regressor, 20 linguistic features                  |
| Tokenization  | tiktoken (cl100k_base), model-specific adjustments          |
| Optimization  | Groq API — Llama 3.3 70B (free tier)                       |
| Frontend      | React 18, TypeScript, Vite, Tailwind CSS, React Router      |
| Extension     | Chrome Manifest V3, vanilla JS content script + popup       |

## Project structure

```
promptiq/
├── backend/
│   ├── app/
│   │   ├── models/        SQLAlchemy models (User, Prompt, AIModel)
│   │   ├── schemas/       Pydantic request/response schemas
│   │   ├── routers/       auth, prompts, models endpoints
│   │   ├── services/      classification, scoring, tokenizer, optimization
│   │   ├── core/          security (JWT, password hashing), dependencies
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── ml_models/         trained model artifacts (NOT in git — see below)
│   ├── tests/             pytest suite
│   ├── requirements.txt
│   ├── seed_models.py     seeds the ai_models reference table
│   └── .env.example       template for required environment variables
├── frontend/               React app (Vite + Tailwind)
├── extension/               Chrome extension (flat file structure)
├── ml_notebooks/            Colab notebooks: data generation + model training
└── docker-compose.yml        MySQL 8 container definition
```

## Prerequisites

- Python 3.11
- Node.js 20+
- Docker Desktop
- A free Groq API key — [console.groq.com](https://console.groq.com)

## Setup

### 1 — Database

```bash
docker compose up -d
docker compose ps   # wait until STATUS shows "healthy"
```

### 2 — Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows
# source venv/bin/activate         # macOS/Linux

pip install -r requirements.txt
pip install torch==2.4.1+cpu --index-url https://download.pytorch.org/whl/cpu
pip install transformers==4.45.0

cp .env.example .env               # then fill in your real values
python seed_models.py
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000` — Swagger docs at `/docs`.

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### 4 — Chrome extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Visit ChatGPT, Claude, or Gemini — a floating **🧠 Analyze** button appears
5. Click the extension icon in your toolbar to log in and unlock the
   Optimize feature (Performance / Economy modes)

## ML models

Trained model artifacts (`ml_models/classifier/`, `ml_models/scorer/`) are
**excluded from this repository** — they're several hundred MB and exceed
GitHub's file size limits. The backend runs without them, falling back to
keyword-based classification and heuristic scoring automatically.

To use the real ML models:

1. Open the notebooks in `ml_notebooks/` in Google Colab (free GPU tier)
2. Run `01_generate_data.py` → produces training datasets via Groq
3. Run `02_train_classifier.py` → trains DistilBERT, downloads a zip
4. Run `03_train_scorer.py` → trains XGBoost, downloads a zip
5. Unzip both into `backend/ml_models/classifier/` and
   `backend/ml_models/scorer/` respectively
6. Restart the backend — you'll see `✅ Classifier model loaded` and
   `✅ Scoring model loaded` in the console

## Testing

```bash
cd backend
pytest tests/ -v
```

## Known limitations

- CORS is fully open (`allow_origins=["*"]`) for local development —
  a production deployment would need to restrict this to trusted origins.
- Token cost estimates use a static pricing table rather than live
  provider pricing APIs.
- The scoring dataset (500 LLM-judged prompts) has inherent label noise
  from using LLM-as-judge rather than fully human-verified scores.
- The classifier and scorer models operate independently and are not
  reconciled against each other.

## License

Academic project — ESPRIT, Data Science & AI Engineering, 2026.
