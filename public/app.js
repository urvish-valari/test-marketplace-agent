const messagesEl  = document.getElementById('messages');
const inputEl     = document.getElementById('userInput');
const sendBtn     = document.getElementById('sendBtn');
const rawEl       = document.getElementById('rawResponse');
const statusDot   = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');

let rawVisible = false;
let sessionId  = 'session-' + Math.random().toString(36).slice(2, 9);

// ─── Health check on load ─────────────────────────────────────────────────────

async function checkHealth() {
  try {
    const res = await fetch('/health');
    if (res.ok) {
      statusDot.classList.add('online');
      statusLabel.textContent = 'Agent Online';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.classList.add('offline');
    statusLabel.textContent = 'Agent Offline';
  }
}

checkHealth();

// ─── Chat helpers ─────────────────────────────────────────────────────────────

function addMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message', role);

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.innerHTML = text;

  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

function addTyping() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message', 'agent', 'typing');
  wrapper.innerHTML = '<div class="bubble"><span></span><span></span><span></span></div>';
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = '';
  sendBtn.disabled = true;

  addMessage('user', text);

  const typing = addTyping();

  try {
    const res = await fetch('/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message: text, history: [] }),
    });

    const data = await res.json();
    typing.remove();

    if (data.status === 'success') {
      addMessage('agent', data.reply);
      rawEl.textContent = JSON.stringify(data, null, 2);
    } else {
      addMessage('agent', `<span style="color:#ef4444">Error: ${data.message || 'Something went wrong.'}</span>`);
      rawEl.textContent = JSON.stringify(data, null, 2);
    }

  } catch (err) {
    typing.remove();
    addMessage('agent', '<span style="color:#ef4444">Network error — could not reach the agent endpoint.</span>');
    rawEl.textContent = String(err);
  }

  sendBtn.disabled = false;
  inputEl.focus();
}

sendBtn.addEventListener('click', sendMessage);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ─── Raw response toggle ──────────────────────────────────────────────────────

function toggleRaw() {
  rawVisible = !rawVisible;
  rawEl.style.display = rawVisible ? 'block' : 'none';
  document.getElementById('rawToggle').textContent = rawVisible
    ? 'Hide raw API response ▲'
    : 'Show raw API response ▼';
}
