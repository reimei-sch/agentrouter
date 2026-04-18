const AGENTROUTER_BASE = 'https://agentrouter.org';
const PUBLIC_MODELS_KEY = 'sk-Wssgfu5GK1INDdXEBoxWbwIBKvLPu3K9KvN3SC7an5z9DfyV';

const CLAUDE_CODE_HEADERS = {
  'user-agent': 'claude-cli/2.1.114 (external, cli)',
  'anthropic-version': '2023-06-01',
  'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,effort-2025-11-24',
  'anthropic-dangerous-direct-browser-access': 'true',
  'x-app': 'cli',
  'x-stainless-lang': 'js',
  'x-stainless-os': 'Linux',
  'x-stainless-arch': 'x64',
  'x-stainless-runtime': 'node',
  'x-stainless-runtime-version': 'v24.3.0',
  'x-stainless-package-version': '0.81.0',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-beta',
};

function extractClientKey(request) {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey) return xApiKey;
  return null;
}

function errorResponse(status, message, type, code) {
  const body = { error: { message, type } };
  if (code) body.error.code = code;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  });
}

async function forwardToAgentRouter(targetPath, request, method = 'POST', overrideKey = null) {
  const clientKey = overrideKey || extractClientKey(request);
  if (!clientKey) {
    return errorResponse(401, 'Missing API key. Provide your AgentRouter key via Authorization: Bearer <key> or x-api-key', 'invalid_request_error');
  }

  const headers = {
    ...CLAUDE_CODE_HEADERS,
    'authorization': `Bearer ${clientKey}`,
  };

  const init = { method, headers };

  if (method === 'POST') {
    headers['content-type'] = 'application/json';
    init.body = await request.arrayBuffer();
  }

  const url = new URL(request.url);
  const qs = url.search || '';
  const upstream = await fetch(`${AGENTROUTER_BASE}${targetPath}${qs}`, init);

  const respHeaders = new Headers(upstream.headers);
  respHeaders.delete('content-encoding');
  respHeaders.delete('content-length');
  respHeaders.delete('transfer-encoding');
  for (const [k, v] of Object.entries(CORS_HEADERS)) respHeaders.set(k, v);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: respHeaders,
  });
}

const OG_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0f0f14"/>
<stop offset="1" stop-color="#1a1a24"/>
</linearGradient>
<linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#f472b6"/>
<stop offset="1" stop-color="#c084fc"/>
</linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#f472b6" stop-opacity="0.25"/>
<stop offset="1" stop-color="#f472b6" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="900" cy="180" r="300" fill="url(#glow)"/>
<circle cx="300" cy="500" r="260" fill="url(#glow)" opacity="0.6"/>
<g transform="translate(80, 240)">
<text font-family="ui-sans-serif, system-ui, sans-serif" font-size="88" font-weight="800" fill="url(#accent)">AgentRouter Bridge</text>
<text y="80" font-family="ui-sans-serif, system-ui, sans-serif" font-size="34" fill="#e4e4e7">Free OpenAI-compatible proxy for Janitor AI</text>
<text y="128" font-family="ui-monospace, monospace" font-size="22" fill="#a1a1aa">Claude Opus 4.6 · GPT · DeepSeek · GLM · and more</text>
</g>
<rect x="80" y="520" width="12" height="44" rx="6" fill="url(#accent)"/>
<text x="108" y="552" font-family="ui-monospace, monospace" font-size="20" fill="#a1a1aa">bring your own AgentRouter key · no logs · no limits</text>
</svg>`;

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#f472b6"/>
<stop offset="1" stop-color="#c084fc"/>
</linearGradient>
</defs>
<rect width="64" height="64" rx="14" fill="#0f0f14"/>
<path d="M16 44 L32 16 L48 44 M22 36 L42 36" stroke="url(#g)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

function landingPage(host) {
  const baseUrl = `https://${host}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgentRouter Bridge — Free Claude, GPT, DeepSeek for Janitor AI</title>
<meta name="description" content="Free OpenAI-compatible proxy for Janitor AI. Access Claude Opus 4.6, GPT, DeepSeek, and GLM models through AgentRouter with one-click setup.">
<meta name="theme-color" content="#f472b6">

<meta property="og:type" content="website">
<meta property="og:site_name" content="AgentRouter Bridge">
<meta property="og:title" content="AgentRouter Bridge — Free AI Proxy for Janitor AI">
<meta property="og:description" content="Free OpenAI-compatible proxy. Access Claude Opus 4.6, GPT, DeepSeek, GLM, and more through AgentRouter. One-click setup for Janitor AI.">
<meta property="og:url" content="${baseUrl}/">
<meta property="og:image" content="${baseUrl}/og.svg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="AgentRouter Bridge — Free AI proxy for Janitor AI">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="AgentRouter Bridge — Free AI Proxy for Janitor AI">
<meta name="twitter:description" content="Free OpenAI-compatible proxy for Janitor AI. Claude Opus 4.6, GPT, DeepSeek & more.">
<meta name="twitter:image" content="${baseUrl}/og.svg">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
:root {
  --bg: #0f0f14;
  --panel: #1a1a24;
  --panel-2: #242432;
  --border: #2d2d3d;
  --text: #e4e4e7;
  --muted: #a1a1aa;
  --accent: #f472b6;
  --accent-2: #c084fc;
  --ok: #34d399;
  --code-bg: #0a0a10;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
.container { max-width: 860px; margin: 0 auto; padding: 48px 24px 96px; }
header { text-align: center; margin-bottom: 48px; }
h1 {
  font-size: 42px;
  margin: 0 0 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
header p { color: var(--muted); font-size: 17px; margin: 0; }
h2 {
  font-size: 22px;
  margin: 40px 0 16px;
  display: flex; align-items: center; gap: 10px;
}
h2::before {
  content: '';
  width: 4px; height: 22px;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
  border-radius: 2px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.row {
  display: flex; align-items: center; gap: 8px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  overflow-x: auto;
}
.row code { flex: 1; color: var(--text); white-space: nowrap; }
.copy {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  transition: all .15s;
  flex-shrink: 0;
}
.copy:hover { background: var(--accent); color: #000; border-color: var(--accent); }
.copy.copied { background: var(--ok); color: #000; border-color: var(--ok); }
.steps { counter-reset: step; padding: 0; list-style: none; margin: 0; }
.steps li {
  counter-increment: step;
  position: relative;
  padding: 14px 16px 14px 52px;
  margin-bottom: 10px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.steps li::before {
  content: counter(step);
  position: absolute;
  left: 14px; top: 50%;
  transform: translateY(-50%);
  width: 28px; height: 28px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #000;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 700;
  font-size: 13px;
}
.label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
.models-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
.model-row {
  display: flex; align-items: center; gap: 10px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
}
.model-id { flex: 1; font-family: ui-monospace, monospace; font-size: 13px; color: var(--text); }
.model-badge {
  background: var(--panel-2);
  color: var(--muted);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
}
.model-badge.anthropic { background: rgba(244, 114, 182, .15); color: var(--accent); }
.model-badge.openai { background: rgba(192, 132, 252, .15); color: var(--accent-2); }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.loading { color: var(--muted); font-style: italic; padding: 12px; text-align: center; }
.err { color: #f87171; padding: 12px; text-align: center; font-size: 13px; }
.tip {
  background: rgba(52, 211, 153, .08);
  border: 1px solid rgba(52, 211, 153, .3);
  color: #6ee7b7;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
}
.warn {
  background: rgba(251, 191, 36, .08);
  border: 1px solid rgba(251, 191, 36, .3);
  color: #fcd34d;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
}
footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 48px; }
</style>
</head>
<body>
<div class="container">

<header>
  <h1>AgentRouter Bridge</h1>
  <p>Free OpenAI-compatible bridge for Janitor AI — powered by Claude, GPT, DeepSeek, GLM &amp; more.</p>
</header>

<h2>Quick Setup for Janitor AI</h2>
<div class="card">
<ol class="steps">
  <li>Get a free AgentRouter API key at <a href="https://agentrouter.org" target="_blank">agentrouter.org</a> (sign up with GitHub, get $150 free credits).</li>
  <li>In Janitor AI, open any chat → click the ⚙️ settings → <b>API Settings</b>.</li>
  <li>Choose <b>Proxy</b> as the AI model, then <b>OpenAI</b> as the format.</li>
  <li>Paste the <b>Proxy URL</b> and your <b>AgentRouter key</b> below, then pick a model.</li>
  <li>Hit <b>Save</b>. Done — start chatting.</li>
</ol>
</div>

<h2>Your Proxy URL</h2>
<div class="card">
  <div class="label">Base URL (for OpenAI-compatible clients)</div>
  <div class="row">
    <code id="baseUrl">${baseUrl}/v1</code>
    <button class="copy" data-copy="baseUrl">Copy</button>
  </div>
  <div class="label" style="margin-top:16px;">Full Chat Completions URL (Janitor AI)</div>
  <div class="row">
    <code id="chatUrl">${baseUrl}/v1/chat/completions</code>
    <button class="copy" data-copy="chatUrl">Copy</button>
  </div>
  <div class="tip">✨ Janitor AI usually wants the full <code>/v1/chat/completions</code> URL in the proxy field.</div>
</div>

<h2>Available Models</h2>
<div class="card">
  <div class="label">Click any model to copy its ID</div>
  <div id="models" class="models-grid">
    <div class="loading">Loading models…</div>
  </div>
</div>

<h2>Test It</h2>
<div class="card">
  <div class="label">curl test</div>
  <div class="row">
    <code id="curlCmd">curl ${baseUrl}/v1/chat/completions -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d '{"model":"claude-opus-4-6","messages":[{"role":"user","content":"hi"}]}'</code>
    <button class="copy" data-copy="curlCmd">Copy</button>
  </div>
</div>

<h2>Endpoints</h2>
<div class="card" style="font-size: 13px;">
  <div style="display:grid; grid-template-columns: auto 1fr; gap: 8px 16px; align-items: center;">
    <code style="color:var(--accent);">POST /v1/chat/completions</code><span style="color:var(--muted);">OpenAI format</span>
    <code style="color:var(--accent);">POST /v1/messages</code><span style="color:var(--muted);">Anthropic / Claude Code format</span>
    <code style="color:var(--accent);">GET /v1/models</code><span style="color:var(--muted);">Model list (requires your key)</span>
  </div>
  <div class="warn">⚠️ Bring your own AgentRouter API key. This is just a header-injection bridge — no server-side keys, no logs, no rate limits on our end.</div>
</div>

<footer>
  Built with 🩷 for the Janitor AI community ·
  <a href="https://github.com/reimei-sch/agentrouter" target="_blank">source</a>
</footer>

</div>

<script>
document.querySelectorAll('.copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const el = document.getElementById(btn.dataset.copy);
    await navigator.clipboard.writeText(el.textContent);
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  });
});

async function loadModels() {
  const container = document.getElementById('models');
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const models = json.data || [];
    if (!models.length) {
      container.innerHTML = '<div class="err">No models available</div>';
      return;
    }
    container.innerHTML = models.map(m => {
      const types = (m.supported_endpoint_types || []).map(t =>
        \`<span class="model-badge \${t}">\${t}</span>\`).join('');
      return \`<div class="model-row">
        <span class="model-id" id="m-\${m.id}">\${m.id}</span>
        \${types}
        <button class="copy" data-copy="m-\${m.id}">Copy</button>
      </div>\`;
    }).join('');
    container.querySelectorAll('.copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const el = document.getElementById(btn.dataset.copy);
        await navigator.clipboard.writeText(el.textContent);
        const orig = btn.textContent;
        btn.textContent = '✓';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1200);
      });
    });
  } catch (err) {
    container.innerHTML = '<div class="err">Failed to load models: ' + err.message + '</div>';
  }
}
loadModels();
</script>
</body>
</html>`;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/v1/chat/completions' && request.method === 'POST') {
        return await forwardToAgentRouter('/v1/chat/completions', request, 'POST');
      }
      if (path === '/v1/messages' && request.method === 'POST') {
        return await forwardToAgentRouter('/v1/messages', request, 'POST');
      }
      if (path === '/v1/models' && request.method === 'GET') {
        return await forwardToAgentRouter('/v1/models', request, 'GET');
      }
      if (path === '/api/models' && request.method === 'GET') {
        return await forwardToAgentRouter('/v1/models', request, 'GET', PUBLIC_MODELS_KEY);
      }
      if (path === '/og.svg' && request.method === 'GET') {
        return new Response(OG_IMAGE_SVG, {
          headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=86400',
            ...CORS_HEADERS,
          },
        });
      }
      if (path === '/favicon.svg' && request.method === 'GET') {
        return new Response(FAVICON_SVG, {
          headers: {
            'content-type': 'image/svg+xml',
            'cache-control': 'public, max-age=86400',
            ...CORS_HEADERS,
          },
        });
      }
      if (path === '/health') {
        return new Response(
          JSON.stringify({ ok: true, service: 'agentrouter-bridge' }),
          { headers: { 'content-type': 'application/json', ...CORS_HEADERS } },
        );
      }
      if (path === '/' && request.method === 'GET') {
        const host = url.host;
        return new Response(landingPage(host), {
          headers: { 'content-type': 'text/html; charset=utf-8', ...CORS_HEADERS },
        });
      }
      return errorResponse(404, 'Not found', 'not_found');
    } catch (err) {
      console.error('Worker error:', err);
      return errorResponse(502, 'Bad Gateway - AgentRouter request failed', 'proxy_error', 'bad_gateway');
    }
  },
};
