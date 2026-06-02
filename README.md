# Spur – Founding Full‑Stack Engineer Take‑Home
### Mini AI Support Agent Dashboard for StyleStore

This repository contains a full-stack, single-page conversational support console built as part of the Spur take-home assessment. The application allows customers of a fictional e-commerce store, **StyleStore**, to interact with an AI support agent that answers questions about shipping policies, returns, refunds, and support hours using the Groq API (powered by Llama 3.1 8B).

---

## 🚀 How to Run Locally (Step-by-Step)

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Docker](https://www.docker.com/) (for running PostgreSQL database)

---

### Step 1: Start the Database (PostgreSQL)
A PostgreSQL container configuration is provided at the root of the workspace.

1.  Open your terminal in the root directory of the project.
2.  Start the database in the background:
    ```bash
    docker-compose up -d
    ```
    This launches a PostgreSQL database listening on `localhost:5432` with the database name `spurdb`.

---

### Step 2: Configure and Start the Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables by creating a `.env` file in the `backend/` directory:
    ```env
    DATABASE_URL="postgresql://atul:atul123@localhost:5432/spurdb"
    GROQ_API_KEY="your_groq_api_key_here"
    PORT=3000
    ```
    *(Note: A valid database URL and temporary testing API key are already pre-configured in the repository's workspace environment).*

4.  Push the database schema and generate the Prisma Client:
    ```bash
    npx prisma db push
    npx prisma generate
    ```
5.  Start the backend development server:
    ```bash
    npm run dev
    ```
    The server will compile the TypeScript files and start listening on `http://localhost:3000`. It automatically watches the `src` directory and rebuilds on code changes.

---

### Step 3: Configure and Start the Frontend

1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
4.  Open the application in your browser at:
    ```
    http://localhost:5173/
    ```

---

## 🏛️ Architecture Overview

The codebase is structured into clean layers, maintaining a strict separation of concerns that ensures extensibility for adding new messaging channels (like WhatsApp, Instagram, or Facebook) or custom internal tools later.

```
c:\Users\91914\Desktop\Spur chat
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database models for Conversations & Messages
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.routes.ts  # Express API endpoints & input validation
│   │   ├── services/
│   │   │   ├── chat.service.ts # DB orchestration & conversation flow management
│   │   │   └── llm.service.ts  # Groq API client wrapping & Prompt Design
│   │   ├── db.ts               # pg pool initialization & Prisma 7 adapter setup
│   │   └── index.ts            # App entrypoint (Express & global error handling)
│   ├── tsconfig.json           # Compiler rules (excludes output directory)
│   └── package.json            # Scripts & backend dependencies
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── chat.tsx        # Dashboard layout, state machine & markdown parser
    │   ├── index.css           # Global custom scrollbars, layout rules & animations
    │   └── main.tsx            # React mounting entrypoint
```

### Layer Descriptions

1.  **Entrypoint (`index.ts`):** Initializes the Express application, configures CORS, and wires routes. It starts the server and registers top-level uncaught exception and unhandled rejection listeners to prevent silent backend crashes.
2.  **Routing Layer (`routes/chat.routes.ts`):** Exposes HTTP endpoints (`POST /chat/message` and `GET /chat/:sessionId`). It performs input validation (e.g., rejecting empty inputs and truncating/rejecting messages longer than 1000 characters) and handles errors cleanly with `try/catch` wrappers.
3.  **Service Layer (`services/chat.service.ts`):** Coordinates core business logic. It handles conversation instantiation, saves records to the database, queries the database for context history (fetching the last 10 messages), feeds history to the LLM, and logs replies.
4.  **LLM Service (`services/llm.service.ts`):** Encapsulates connection with the Groq SDK. It formats context arrays, applies the e-commerce system prompt, and intercepts API errors (rate limits, timeouts) to present readable error strings back to the user.
5.  **Database Connection (`db.ts`):** Under Prisma v7, direct schema-level database strings are deprecated for server-side environments. We initialize a `pg.Pool` connection pool and pass the `PrismaPg` adapter to the `PrismaClient` constructor for native, robust pooling.

---

## 🤖 LLM Integration & Prompt Design

*   **Provider:** We utilize the **Groq API** with the **`llama-3.1-8b-instant`** model. This provides sub-second token generation times, making it ideal for simulating realistic live support chat.
*   **System Prompt:** The LLM is primed as a helpful customer support agent representing **StyleStore**. The prompt outlines specific shipping times (3-5 days in India, 7-14 days international), return policies (30 days unused in original packaging), refund details (5-7 days), support hours (Mon-Sat, 9 AM to 6 PM IST), and demands a friendly, concise tone.
*   **Context Window:** We query the database and retrieve the last 10 messages associated with the current `sessionId`. These messages are mapped to standard ChatCompletion roles (`user` or `assistant`) and fed into the Groq API call as context history. This provides coherent multi-turn conversations without ballooning API costs or exceeding token limit thresholds.
*   **Guardrails:** The Groq completions call is wrapped in a `try/catch` handler. In the event of a timeout, rate limit, or invalid API credentials, it logs the error output to the server console and falls back to a user-friendly generic message (*"Sorry, I could not generate a reply. Please try again."*) instead of throwing unhandled exceptions.

---

## 🔄 Extensibility (For WhatsApp, Instagram, etc.)

Because the LLM and database actions are decoupled from the HTTP transport layer, expanding this application to support other communication channels is straightforward:

```mermaid
graph TD
    A[Vite Web Interface] -->|POST /chat/message| B(Express Router)
    C[WhatsApp Webhook] -->|Incoming message event| D(WhatsApp Controller)
    E[Instagram webhook] -->|Incoming message event| F(Instagram Controller)
    
    B --> G[chat.service.ts: handleMessage]
    D --> G
    F --> G
    
    G --> H[(PostgreSQL Database)]
    G --> I[llm.service.ts: generateReply]
    I --> J[Groq API]
```

To add WhatsApp:
1.  Create a webhook route in the Express router (`POST /webhooks/whatsapp`).
2.  Verify the WhatsApp payload, extract the incoming message and the customer's phone number (which acts as the `sessionId`).
3.  Import and execute `handleMessage(phoneNumber, messageText)`.
4.  Use the returned reply to trigger a POST request back to the WhatsApp Business API.

The LLM logic, conversation memory, database logs, and error parameters remain identical, ensuring high code reusability.

---

## 🛡️ Robustness & Safety Guardrails
*   **Input Validation:** The backend API rejects empty inputs or blank whitespaces (400 Bad Request). Text inputs are limited to 1000 characters to prevent prompt injection or excessive token usage.
*   **No Silent Failures:** Database connection failures or LLM timeouts are caught at the controller level and returned as clean JSON error states.
*   **Strict Secrets Management:** All API tokens and database URIs are loaded via `dotenv` from `.env` files. No credentials are hardcoded into git.
*   **Clean Build Targets:** The project excludes output folders (`dist`) from compiling paths in `tsconfig.json` to prevent TS5055 overwrite collisions.

---

## 🔧 Trade-offs & "If I Had More Time..."

1.  **Caching layer (Redis):** Currently, chat history is loaded directly from PostgreSQL on every request. In a production-grade application, we would store active chat sessions in Redis for fast reads and writes, periodically flushing conversations back to PostgreSQL for permanent storage.
2.  **Dynamic Domain Knowledge (RAG):** Fictional store policies are currently hardcoded directly into the system prompt. For a real storefront with thousands of SKUs and dynamic inventories, we would implement Vector Embeddings (PGVector) and retrieve relevant context dynamically via Retrieval-Augmented Generation (RAG).
3.  **Automated Tests:** Given more time, we would implement unit tests for the services (using Jest) and end-to-end integration tests (using Playwright) to test conversational paths automatically.
4.  **Media & Rich Messages:** Currently, the system supports plain-text messages. We would add support for file attachments (images, PDFs) in the chat panel, allowing customers to upload receipts or product damage pictures.
