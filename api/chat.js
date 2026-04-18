import {
  AGENTROUTER_BASE,
  collectBody,
  setCorsHeaders,
  extractClientKey,
  buildProviderHeaders,
  forwardResponse,
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

    const bodyBuffer = await collectBody(req);
    const headers = buildProviderHeaders(clientKey, bodyBuffer);

    const response = await fetch(`${AGENTROUTER_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: bodyBuffer || undefined,
    });

    await forwardResponse(response, res);
  } catch (err) {
    console.error('AgentRouter chat proxy error:', err);
    sendError(res, 502, 'Bad Gateway - AgentRouter request failed', 'proxy_error', 'bad_gateway');
  }
}
