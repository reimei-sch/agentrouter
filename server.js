import http from 'http';
import {
  AGENTROUTER_BASE,
  CLAUDE_CODE_HEADERS,
  collectBody,
  setCorsHeaders,
  extractClientKey,
  buildProviderHeaders,
  forwardResponse,
  sendError,
} from './api/utils.js';

const PORT = process.env.PORT || 3000;

function wrapRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (data) => { res.end(data); return res; };
  Object.defineProperty(res, 'headersSent', {
    get() { return res._header !== null && res._header !== undefined; },
    configurable: true,
  });
  return res;
}

async function handleChat(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const clientKey = extractClientKey(req);
  if (!clientKey) {
    return sendError(res, 401, 'Missing API key. Provide your AgentRouter key via Authorization: Bearer <key>', 'invalid_request_error');
  }

  const bodyBuffer = await collectBody(req);
  const headers = buildProviderHeaders(clientKey, bodyBuffer);

  const response = await fetch(`${AGENTROUTER_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: bodyBuffer || undefined,
  });

  await forwardResponse(response, res);
}

async function handleMessages(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const clientKey = extractClientKey(req);
  if (!clientKey) {
    return sendError(res, 401, 'Missing API key. Provide your AgentRouter key via Authorization: Bearer <key> or x-api-key', 'invalid_request_error');
  }

  const bodyBuffer = await collectBody(req);
  const headers = buildProviderHeaders(clientKey, bodyBuffer);

  const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const response = await fetch(`${AGENTROUTER_BASE}/v1/messages${qs}`, {
    method: 'POST',
    headers,
    body: bodyBuffer || undefined,
  });

  await forwardResponse(response, res);
}

async function handleModels(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const clientKey = extractClientKey(req);
  if (!clientKey) {
    return sendError(res, 401, 'Missing API key. Provide your AgentRouter key via Authorization: Bearer <key>', 'invalid_request_error');
  }

  const headers = {
    ...CLAUDE_CODE_HEADERS,
    'authorization': `Bearer ${clientKey}`,
  };

  const response = await fetch(`${AGENTROUTER_BASE}/v1/models`, { method: 'GET', headers });
  const data = await response.json();
  res.status(response.status).json(data);
}

const server = http.createServer(async (req, res) => {
  wrapRes(res);
  const path = req.url.split('?')[0];

  try {
    if (path === '/v1/chat/completions') {
      await handleChat(req, res);
    } else if (path === '/v1/messages') {
      await handleMessages(req, res);
    } else if (path === '/v1/models') {
      await handleModels(req, res);
    } else if (path === '/' || path === '/health') {
      res.status(200).json({ ok: true, service: 'agentrouter-bridge' });
    } else {
      res.status(404).json({ error: { message: 'Not found', type: 'not_found' } });
    }
  } catch (err) {
    console.error('Handler error:', err);
    sendError(res, 502, 'Bad Gateway - AgentRouter request failed', 'proxy_error', 'bad_gateway');
  }
});

server.listen(PORT, () => {
  console.log(`AgentRouter bridge listening on port ${PORT}`);
});
