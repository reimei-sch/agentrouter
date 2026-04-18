import {
  AGENTROUTER_BASE,
  CLAUDE_CODE_HEADERS,
  setCorsHeaders,
  extractClientKey,
  sendError,
} from './utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
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
  } catch (err) {
    console.error('AgentRouter models proxy error:', err);
    sendError(res, 502, 'Bad Gateway - AgentRouter request failed', 'proxy_error', 'bad_gateway');
  }
}
