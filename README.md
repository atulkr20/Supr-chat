# Spur AI Support Chat

A mini AI-powered live chat widget for a fictional e-commerce store. Built as part of the Spur engineering take-home assignment.

**Live demo:** [https://supr-chat.vercel.app/](https://supr-chat.vercel.app/)

---

## Stack

- **Backend:** Node.js + TypeScript + Express
- **Frontend:** React + Vite
- **Database:** PostgreSQL (via Docker)
- **ORM:** Prisma
- **LLM:** Groq (llama-3.1-8b-instant)

---

## Running Locally

### Prerequisites

- Node.js 18+
- Docker Desktop

### 1. Clone the repo

```bash
git clone https://github.com/atulkr20/Supr-chat.git
cd Supr-chat
```

### 2. Start Postgres with Docker

You can start the pre-configured database using Docker Compose from the root directory:

```bash
docker-compose up -d
```

Alternatively, you can spin up the container manually using:

```bash
docker run --name spur-postgres \
  -e POSTGRES_USER=atul \
  -e POSTGRES_PASSWORD=atul123 \
  -e POSTGRES_DB=spurdb \
  -p 5432:5432 \
  -d postgres
```

### 3. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://atul:atul123@localhost:5432/spurdb"
GROQ_API_KEY="your_groq_api_key_here"
PORT=3000
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

Start the server:

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### 4. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## API

### POST /chat/message

```json
// Request
{ "message": "What is your return policy?", "sessionId": "optional-uuid" }

// Response
{ "reply": "...", "sessionId": "uuid" }
```

### GET /chat/:sessionId

Returns full message history for a session.

---

## Architecture

```
backend/
  src/
    routes/        → HTTP layer, input validation
    services/      → business logic (chat, LLM)
    db.ts          → Prisma client
    index.ts       → Express server setup
```

The backend is split into three clear layers: routes handle HTTP and validation, services handle business logic, and Prisma handles all DB access. The LLM call is fully isolated in `llm.service.ts` so swapping providers (OpenAI, Anthropic, etc.) requires changing one file.

The frontend stores `sessionId` in `localStorage` so chat history persists across page reloads.

---

## LLM Notes

- **Provider:** Groq (free tier, OpenAI-compatible)
- **Model:** llama-3.1-8b-instant
- **Prompting:** A system prompt defines the store persona and hardcodes FAQ knowledge (shipping, returns, refunds, support hours, payment methods). The last 10 messages are passed as conversation history so replies stay contextual.
- **Error handling:** LLM errors are caught and return a clean error message to the user. Max tokens capped at 500 to control cost.

---

## Trade-offs and If I Had More Time

**Trade-offs made:**
- FAQ knowledge is hardcoded in the system prompt. Simple and fast, but not editable without a code change.
- No auth. Sessions are identified by a UUID stored in localStorage. Fine for this exercise, not for production.
- Last 10 messages sent as context. Keeps token usage low but drops older context in long conversations.

**If I had more time:**
- Move FAQ knowledge to the database so it's editable via an admin panel
- Add Redis to cache recent conversations and reduce DB reads
- Stream the LLM response token by token for a better UX
- Add rate limiting per session to prevent abuse
- Write tests for the chat service and LLM error cases