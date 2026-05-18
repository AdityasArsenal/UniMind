# UniMind — Local Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+

---

## 1. Backend Setup

```bash
cd backend-python

# Install dependencies
pip install -r requirements.txt

# Seed the database (run once)
python seed_data/run_seed.py

# Start the server
python -m uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**
API docs (Swagger): **http://localhost:8000/docs**

---

## 2. Frontend Setup

```bash
cd frontend-react

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 3. First Time Flow

1. Open http://localhost:5173
2. Click "Create your agent" → signup with name, email, password
3. Chat with the AI knowledge engine (or skip)
4. Complete the 3-step onboarding questionnaire
5. Explore the Agentic Web → click the core → run your life simulation
6. Navigate to Community → post and interact

---

## 4. Environment Variables

The backend reads from `backend-python/.env`. Copy `.env.example` and fill in:
- `OPENAI_API_KEY` — Azure OpenAI key
- `AZURE_ENDPOINT` — Azure resource endpoint
- `JWT_SECRET` — Random 64-char string for production
- `DB_PATH` — SQLite database path (default: `./unimind.db`)
