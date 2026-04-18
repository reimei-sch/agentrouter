export const AGENTROUTER_BASE = 'https://agentrouter.org';

export const CLAUDE_CODE_HEADERS = {
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

export function collectBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve(null);
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-beta');
}

export function extractClientKey(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  if (req.headers['x-api-key']) return req.headers['x-api-key'];
  return null;
}

export function buildProviderHeaders(clientApiKey, bodyBuffer) {
  const headers = {
    ...CLAUDE_CODE_HEADERS,
    'authorization': `Bearer ${clientApiKey}`,
    'content-type': 'application/json',
  };
  if (bodyBuffer && bodyBuffer.length > 0) {
    headers['content-length'] = bodyBuffer.length;
  }
  return headers;
}

export function sendError(res, status, message, type, code) {
  if (!res.headersSent) {
    const body = { error: { message, type } };
    if (code) body.error.code = code;
    res.status(status).json(body);
  }
}

export async function forwardResponse(response, res) {
  const responseHeaders = Object.fromEntries(response.headers.entries());
  delete responseHeaders['content-encoding'];
  delete responseHeaders['content-length'];
  delete responseHeaders['transfer-encoding'];

  res.status(response.status);
  Object.entries(responseHeaders).forEach(([k, v]) => res.setHeader(k, v));

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } else {
    const data = await response.text();
    res.send(data);
  }
}
