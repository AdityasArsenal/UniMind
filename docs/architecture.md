# UniMind Architecture

## System Overview

```
Browser (localhost:5173)
    │
    │  fetch() with JWT Bearer token
    │
FastAPI Backend (localhost:8000)
    │
    ├── SQLite (unimind.db)
    │       users, posts, reactions, chat_messages, knowledge_chunks, achievements
    │
    └── Azure OpenAI (gpt-5-chat)
            chatbot conversation, knowledge extraction, life simulation
```

---

## Folder Structure

```
unimind-react/           ← git root
├── frontend-react/      ← React + Vite + Three.js + Framer Motion
│   └── src/
│       ├── App.jsx              ← Router (login → signup → chatbot → onboarding → agentic → community)
│       ├── lib/api.js           ← All API calls, JWT from localStorage
│       └── pages/
│           ├── LoginPage.jsx
│           ├── SignupPage.jsx
│           ├── ChatbotPage.jsx  ← Knowledge dump, live profile panel
│           ├── OnboardingPage.jsx
│           ├── AgenticWebPage.jsx
│           └── CommunityPage.jsx
├── backend-python/      ← FastAPI + SQLite + Azure OpenAI
│   ├── main.py          ← App factory, CORS, router mounts
│   ├── db.py            ← SQLite schema + async helpers
│   ├── auth.py          ← JWT + bcrypt
│   ├── models/          ← Pydantic request/response models
│   ├── routers/         ← One file per resource
│   ├── services/
│   │   ├── agent_seed.py    ← Python port of xorshift32, builds 1401 agents at startup
│   │   ├── azure_openai.py  ← AsyncAzureOpenAI wrapper
│   │   └── chatbot_service.py ← Conversation + extraction logic
│   └── seed_data/       ← DB initialization + seed posts
└── docs/                ← This folder
```

---

## Auth Flow

```
Signup → POST /api/auth/signup → JWT token → localStorage
Login  → POST /api/auth/login  → JWT token → localStorage

On app load:
  token in localStorage → GET /api/users/me (verify) → restore session
  no token → show LoginPage
```

---

## Chatbot Knowledge Pipeline

```
User types message
  → POST /api/chatbot/message
      → LLM call 1: Generate assistant reply (full conversation history)
      → LLM call 2: Extract knowledge chunk from user message
      → If knowledge extracted: save to knowledge_chunks table
      → Rebuild agent_bio from all chunks
      → Update users table (agent_bio, agent_skills)
  → Response includes: message + profile_update
      → Frontend updates left panel (bio, skills, progress bar) live
```

---

## Agent Data

1,401 agents are generated in Python at startup using a port of the frontend's `xorshift32` RNG.
The RNG seed and formula are identical, ensuring agent names and scores match what the Three.js
scene displays in the browser. Agents are served from an in-memory list — no DB required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Three.js, Framer Motion, Tailwind |
| Backend | FastAPI, uvicorn, aiosqlite |
| Auth | JWT (python-jose), bcrypt (passlib) |
| AI | Azure OpenAI (AsyncAzureOpenAI, gpt-5-chat) |
| Database | SQLite (file: unimind.db) |
| Dev ports | Frontend: 5173, Backend: 8000 |
