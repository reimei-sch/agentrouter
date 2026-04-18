const AGENTROUTER_BASE = 'https://agentrouter.org';

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

async function forwardToAgentRouter(targetPath, request, method = 'POST') {
  const clientKey = extractClientKey(request);
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
      if (path === '/' || path === '/health') {
        return new Response(
          JSON.stringify({ ok: true, service: 'agentrouter-bridge' }),
          { headers: { 'content-type': 'application/json', ...CORS_HEADERS } },
        );
      }
      return errorResponse(404, 'Not found', 'not_found');
    } catch (err) {
      console.error('Worker error:', err);
      return errorResponse(502, 'Bad Gateway - AgentRouter request failed', 'proxy_error', 'bad_gateway');
    }
  },
};
