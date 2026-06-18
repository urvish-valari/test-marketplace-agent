const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Mock response logic ──────────────────────────────────────────────────────

const fallbackResponses = [
  "I'm a live test agent connected through the marketplace. Your integration is working correctly!",
  "This response is being served directly from the seller's agent endpoint via the marketplace proxy layer.",
  "The API handshake was successful. Your marketplace platform is communicating with my endpoint as expected.",
  "Great — the round-trip is complete. Message received, processed, and returned through your marketplace gateway.",
  "Integration confirmed! This is exactly how a real seller's AI agent would respond on your platform.",
];

function generateReply(message) {
  const msg = message.toLowerCase().trim();

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I'm a demo AI agent connected to your marketplace. The integration is live and working. How can I assist you?";
  }
  if (msg.includes('what can you do') || msg.includes('capabilities') || msg.includes('features')) {
    return "I can answer questions, process text inputs, and serve as a reference implementation for AI agent marketplace integrations. In a real deployment, this would be replaced by a fully capable AI model.";
  }
  if (msg.includes('test') || msg.includes('working') || msg.includes('connected')) {
    return "✅ Connection confirmed. The marketplace successfully reached this agent's API endpoint. Request received, processed, and this response is being returned through your platform's proxy layer.";
  }
  if (msg.includes('price') || msg.includes('cost') || msg.includes('pricing')) {
    return "Pricing is managed through the marketplace platform. As a seller, I have configured my subscription tiers there. Buyers can view and select a plan directly on the marketplace.";
  }
  if (msg.includes('who are you') || msg.includes('what are you')) {
    return "I am a test AI agent — a minimal reference implementation designed to validate how an AI agent marketplace connects to, proxies, and displays responses from a seller's external API endpoint.";
  }

  const index = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[index];
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — marketplace can ping this to verify the agent is online
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'test-marketplace-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Agent metadata — marketplace fetches this to display agent info on the listing page
app.get('/agent/info', (req, res) => {
  res.json({
    name: 'Test Marketplace Agent',
    version: '1.0.0',
    description:
      'A publicly exposed reference AI agent for testing and validating AI agent marketplace integrations. Mimics the structure of a real seller-hosted agent API.',
    author: 'Seller Demo',
    capabilities: ['text-generation', 'question-answering', 'demo-responses'],
    pricing_model: 'per-message',
    supported_languages: ['en'],
    chat_endpoint: '/v1/chat',
    chat_method: 'POST',
    timestamp: new Date().toISOString(),
  });
});

// Primary chat endpoint — this is what the marketplace calls when a buyer sends a message
app.post('/v1/chat', (req, res) => {
  const { session_id, message, history } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      status: 'error',
      error: 'Bad Request',
      message: 'The "message" field is required and must be a non-empty string.',
    });
  }

  const startTime = Date.now();
  const reply = generateReply(message);
  const responseTimeMs = Date.now() - startTime + Math.floor(Math.random() * 80) + 20;

  res.json({
    status: 'success',
    reply,
    session_id: session_id || 'anonymous',
    metadata: {
      model: 'test-agent-v1',
      tokens_used: Math.floor(message.length / 4) + Math.floor(reply.length / 4),
      response_time_ms: responseTimeMs,
      history_length: Array.isArray(history) ? history.length : 0,
      timestamp: new Date().toISOString(),
    },
  });
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Test Marketplace Agent running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Info:    http://localhost:${PORT}/agent/info`);
  console.log(`   Chat:    POST http://localhost:${PORT}/v1/chat\n`);
});
