# Test Marketplace Agent

A lightweight, publicly exposed reference implementation of an AI agent API endpoint — built specifically to **test and validate AI agent marketplace integrations**.

This repository mimics what a real seller would deploy when listing their AI agent on a marketplace platform. It exposes a standard set of HTTP endpoints that a marketplace can discover, connect to, and proxy — allowing buyers to interact with the agent directly within the marketplace UI, without ever being redirected to the seller's own platform.

---

## What This Repository Is For

When building an **AI agent marketplace**, the platform needs a way to:

1. Discover and index third-party AI agents listed by sellers
2. Proxy buyer interactions through the marketplace's own backend
3. Display responses inside the marketplace UI (the buyer never leaves the platform)

This repository serves as a **sandbox seller agent** — a controlled, no-credential, publicly accessible endpoint that can be pointed at by any marketplace to validate that the full integration pipeline is working correctly.

> **In plain terms:** This is a fake seller's product. It pretends to be a real AI agent. You plug it into your marketplace, and if your marketplace can talk to it and show responses to a buyer, your integration works.

---

## How the Marketplace Integration Works

```
┌──────────────────────────────────────────────────────────────┐
│                      BUYER'S BROWSER                         │
│           (only ever sees your marketplace UI)               │
└─────────────────────┬────────────────────────────────────────┘
                      │  1. Buyer types a message
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                  MARKETPLACE BACKEND                         │
│        (your platform — the proxy/gateway layer)             │
│                                                              │
│  - Looks up the agent's registered endpoint URL             │
│  - Makes a server-side POST to /v1/chat on behalf of buyer  │
│  - Forwards the response back to the buyer's browser        │
└─────────────────────┬────────────────────────────────────────┘
                      │  2. Marketplace calls this agent's API
                      ▼
┌──────────────────────────────────────────────────────────────┐
│              THIS REPOSITORY (Seller's Agent)                │
│         POST /v1/chat  ←  receives the message              │
│         Returns a JSON reply with metadata                   │
└──────────────────────────────────────────────────────────────┘
```

The buyer's browser never directly touches this server. The marketplace acts as the man-in-the-middle — authenticating, rate-limiting, tracking usage, and rendering the UI. The seller's API is a black box to the buyer.

---

## API Endpoints

All endpoints are publicly accessible. No API keys or authentication headers are required.

---

### `GET /health`

Verifies the agent is online. Marketplaces typically ping this on a schedule for uptime monitoring and to display an "Online / Offline" badge on the listing page.

**Response**

```json
{
  "status": "ok",
  "agent": "test-marketplace-agent",
  "version": "1.0.0",
  "timestamp": "2026-06-18T10:00:00.000Z",
  "uptime_seconds": 3421
}
```

---

### `GET /agent/info`

Returns structured metadata about the agent. A marketplace fetches this when a seller registers their endpoint — it uses the data to populate the listing page (name, description, capabilities, pricing model, etc.) and to know which endpoint to call for chat.

**Response**

```json
{
  "name": "Test Marketplace Agent",
  "version": "1.0.0",
  "description": "A publicly exposed reference AI agent for testing and validating AI agent marketplace integrations.",
  "author": "Seller Demo",
  "capabilities": ["text-generation", "question-answering", "demo-responses"],
  "pricing_model": "per-message",
  "supported_languages": ["en"],
  "chat_endpoint": "/v1/chat",
  "chat_method": "POST",
  "timestamp": "2026-06-18T10:00:00.000Z"
}
```

---

### `POST /v1/chat`

The primary interaction endpoint. This is what the marketplace backend calls every time a buyer sends a message in the sandbox/test environment.

**Request body**

| Field        | Type     | Required | Description                                                      |
|--------------|----------|----------|------------------------------------------------------------------|
| `message`    | `string` | Yes      | The buyer's input text                                           |
| `session_id` | `string` | No       | An opaque identifier the marketplace uses to group a conversation |
| `history`    | `array`  | No       | Previous messages in the session (for context-aware agents)      |

```json
{
  "session_id": "session-abc123",
  "message": "What can you help me with?",
  "history": []
}
```

**Success response** `200 OK`

```json
{
  "status": "success",
  "reply": "I can answer questions, process text inputs, and demonstrate how an AI agent API integration works with your marketplace.",
  "session_id": "session-abc123",
  "metadata": {
    "model": "test-agent-v1",
    "tokens_used": 48,
    "response_time_ms": 34,
    "history_length": 0,
    "timestamp": "2026-06-18T10:00:00.000Z"
  }
}
```

**Error response** `400 Bad Request`

```json
{
  "status": "error",
  "error": "Bad Request",
  "message": "The \"message\" field is required and must be a non-empty string."
}
```

---

## Quick Start

### Prerequisites

- Node.js 18 or above

### Installation

```bash
git clone https://github.com/your-username/test-marketplace-agent.git
cd test-marketplace-agent
npm install
```

### Run the server

```bash
npm start
```

The server starts on `http://localhost:3000` by default.

```
🚀 Test Marketplace Agent running
   Local:   http://localhost:3000
   Health:  http://localhost:3000/health
   Info:    http://localhost:3000/agent/info
   Chat:    POST http://localhost:3000/v1/chat
```

To use a different port:

```bash
PORT=8080 npm start
```

### Development (auto-reload)

```bash
npm run dev
```

---

## Testing the API Manually

Using `curl`:

```bash
# Health check
curl http://localhost:3000/health

# Agent info
curl http://localhost:3000/agent/info

# Send a chat message
curl -X POST http://localhost:3000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-001", "message": "Hello, are you working?", "history": []}'
```

---

## Project Structure

```
test-marketplace-agent/
├── server.js          # Express backend — all API routes
├── package.json       # Dependencies and scripts
├── public/
│   ├── index.html     # Frontend UI (chat interface + API docs)
│   ├── style.css      # Styling
│   └── app.js         # Frontend JavaScript
└── README.md          # This file
```

---

## Frontend UI

Opening `http://localhost:3000` in a browser shows a built-in test interface that includes:

- **Live status indicator** — shows whether the agent endpoint is reachable (calls `/health` on load)
- **API reference panel** — documents each endpoint with example request/response bodies, with clickable "Try it" links for GET endpoints
- **Live chat interface** — lets you send messages and see responses exactly as a buyer would experience them through the marketplace
- **Raw API response viewer** — toggle to see the exact JSON the agent returns, useful for debugging the integration

---

## How a Marketplace Should Connect to This

The integration steps a marketplace platform would follow:

1. **Registration** — The seller submits their base URL (e.g., `https://your-server.com`) to the marketplace during onboarding.
2. **Discovery** — The marketplace fetches `GET /agent/info` to pull metadata and confirm the agent's chat endpoint path.
3. **Health monitoring** — The marketplace periodically pings `GET /health` to maintain the agent's online/offline status on the listing page.
4. **Sandbox testing** — When a buyer clicks "Test Agent", the marketplace opens a chat window. Every message the buyer sends is proxied server-side to `POST /v1/chat`. The response's `reply` field is displayed in the marketplace UI.
5. **Session management** — The marketplace generates a `session_id` per chat session and includes it in every request, allowing the agent to maintain conversational context.

---

## Deploying to a Public URL

To make this accessible to a remote marketplace platform, deploy it to any Node.js-compatible host:

- **Railway** — connect your GitHub repo, it auto-detects the `npm start` script
- **Render** — free tier, deploy directly from GitHub
- **Fly.io** — `fly launch` in the project directory
- **Heroku** — standard `npm start` Procfile

Once deployed, your public URL (e.g., `https://test-agent.railway.app`) is the base URL the marketplace registers.

---

## License

MIT — free to use, fork, and modify for marketplace integration testing.
