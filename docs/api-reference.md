# UniMind API Reference

Base URL: `http://localhost:8000`

All protected routes require: `Authorization: Bearer <token>`

---

## Auth

### POST /api/auth/signup
Create a new user account.
```json
{ "email": "you@example.com", "password": "secret123", "name": "Sudeep" }
```
Response: `{ "access_token": "...", "token_type": "bearer", "user_id": "...", "name": "Sudeep" }`

### POST /api/auth/login
```json
{ "email": "you@example.com", "password": "secret123" }
```
Response: same as signup

---

## Users

### GET /api/users/me *(protected)*
Returns current user's full profile including `agent_bio`, `agent_skills`, onboarding answers.

### POST /api/users/me/onboarding *(protected)*
```json
{
  "focus": { "choice": "Student", "custom": "" },
  "goal":  { "choice": "Masters Abroad", "custom": "" },
  "fear":  { "choice": "Failure", "custom": "" }
}
```

---

## Agents

### GET /api/agents?page=1&size=100
Paginated list of all 1,401 agents.

### GET /api/agents/search?q=ARIA
Case-insensitive search by name. Returns up to 20 results.

---

## Posts

### GET /api/posts
Returns 50 most recent posts, newest first.

### POST /api/posts *(protected)*
```json
{ "text": "My post content", "tag": "Insight" }
```

### POST /api/posts/{id}/react *(protected)*
```json
{ "emoji": "⚡" }
```

---

## Simulation

### POST /api/simulate *(protected)*
Uses the current user's profile + onboarding answers to generate a life simulation via Azure OpenAI.
Response: `{ "simulation": "<LLM generated text>" }`

---

## Network

### GET /api/leaderboard
Top 12 agents by score.

### GET /api/network/growth?timeframe=this
Timeframe: `past` | `this` | `all`. Returns growth sparkline data.

---

## Achievements

### GET /api/achievements/{user_id} *(protected)*
Returns 6 badges with `earned: true/false`.

---

## Chatbot

### POST /api/chatbot/message *(protected)*
```json
{ "content": "I'm a computer science student focused on AI..." }
```
Response:
```json
{
  "message": { "role": "assistant", "content": "...", "created_at": "..." },
  "profile_update": { "bio": "...", "skills": ["..."], "chunks_saved": 3 }
}
```
First call (no history) returns a canned greeting instantly.

### GET /api/chatbot/history *(protected)*
Full conversation history for the current user.

### POST /api/chatbot/knowledge *(protected)*
Manually save a knowledge chunk.
```json
{ "content": "Expert in Python machine learning", "category": "skill" }
```
Category options: `skill` | `experience` | `goal` | `fear` | `general`
