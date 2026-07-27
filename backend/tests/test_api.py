import pytest, random
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.main import app

client = TestClient(app)

# ── Basic health ────────────────────────────────────────────
def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

# ── Public analyze endpoint ─────────────────────────────────
def test_analyze_basic():
    r = client.post("/api/v1/prompts/analyze", json={"prompt": "Write Python code to sort a list"})
    assert r.status_code == 200
    d = r.json()
    assert "quality_score"   in d
    assert "grade"           in d
    assert "category"        in d
    assert "token_counts"    in d
    assert "recommendations" in d
    assert 0 <= d["quality_score"] <= 100
    print(f"\n  Basic prompt — Score: {d['quality_score']}, Grade: {d['grade']}, Cat: {d['category']}")

def test_analyze_rich_prompt():
    prompt = (
        "You are a senior Python developer with 10 years of experience. "
        "I am building a REST API for an e-commerce platform. "
        "Write a FastAPI endpoint for user authentication using JWT tokens. "
        "Requirements: validate email format, hash password with bcrypt, return JSON with access_token. "
        "Must handle duplicate email errors gracefully."
    )
    r = client.post("/api/v1/prompts/analyze", json={"prompt": prompt})
    assert r.status_code == 200
    d = r.json()
    assert d["quality_score"] >= 60, f"Rich prompt scored too low: {d['quality_score']}"
    print(f"\n  Rich prompt — Score: {d['quality_score']}, Grade: {d['grade']}")

def test_token_counting_accuracy():
    r = client.post("/api/v1/prompts/analyze", json={"prompt": "Hello world"})
    assert r.status_code == 200
    tc = {t["model"]: t["tokens"] for t in r.json()["token_counts"]}
    gpt = tc.get("gpt-4o", 0)
    assert 1 <= gpt <= 5, f"'Hello world' should be ~2 tokens, got {gpt}"

# ── Auth endpoints ──────────────────────────────────────────
def test_register_and_login():
    uid = random.randint(10000, 99999)
    email = f"test{uid}@promptiq.test"
    # Register
    r = client.post("/api/v1/auth/register",
                    json={"username": f"user{uid}", "email": email, "password": "Secure1234!"})
    assert r.status_code == 201, r.text
    # Login
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Secure1234!"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    print(f"\n  Auth test passed for {email}")

def test_duplicate_email():
    uid = random.randint(10000, 99999)
    email = f"dup{uid}@promptiq.test"
    client.post("/api/v1/auth/register",
                json={"username": f"dupA{uid}", "email": email, "password": "Test1234!"})
    r = client.post("/api/v1/auth/register",
                    json={"username": f"dupB{uid}", "email": email, "password": "Test1234!"})
    assert r.status_code == 400

def test_optimize_requires_auth():
    r = client.post("/api/v1/prompts/optimize",
                    json={"prompt": "test", "mode": "PERFORMANCE"})
    assert r.status_code == 403  # No auth header