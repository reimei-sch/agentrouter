# AgentRouter Bridge

Public OpenAI + Anthropic compatible bridge for [AgentRouter](https://agentrouter.org/). Injects Claude Code client headers so AgentRouter accepts requests from any HTTP client.

**Bring your own API key** — stateless header-injection bridge. No server-side keys, no auth gate.

## Endpoints

| Path | Format | Description |
|---|---|---|
| `/v1/chat/completions` | OpenAI | Chat completions |
| `/v1/messages` | Anthropic | Messages API |
| `/v1/models` | OpenAI | Model list |

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New +** → **Web Service**
3. Connect your GitHub and pick this repo
4. Configure:
   - **Environment**: Node
   - **Build Command**: *(leave blank)*
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Click **Create Web Service**

Render assigns a URL like `https://your-service.onrender.com`. No env vars needed.

## Local Development

```bash
npm start
# listens on PORT (default 3000)
```

## Usage

Pass your AgentRouter API key in `Authorization: Bearer <key>` (or `x-api-key` for Anthropic clients).

### OpenAI-compatible clients

```
Base URL: https://your-service.onrender.com/v1
API Key: YOUR_AGENTROUTER_KEY
```

### Claude Code

```bash
export ANTHROPIC_BASE_URL=https://your-service.onrender.com/
export ANTHROPIC_AUTH_TOKEN=YOUR_AGENTROUTER_KEY
export ANTHROPIC_MODEL="claude-opus-4-6"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-haiku-4-5-20251001"
export ANTHROPIC_DEFAULT_SONNET_MODEL="claude-sonnet-4-6"
export ANTHROPIC_DEFAULT_OPUS_MODEL="claude-opus-4-6"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1
unset ANTHROPIC_API_KEY
claude
```

### Test

```bash
curl https://your-service.onrender.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_AGENTROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-opus-4-6","messages":[{"role":"user","content":"Hello!"}],"max_tokens":50}'

curl https://your-service.onrender.com/v1/messages \
  -H "Authorization: Bearer YOUR_AGENTROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-opus-4-6","messages":[{"role":"user","content":"Hello!"}],"max_tokens":50}'

curl https://your-service.onrender.com/v1/models \
  -H "Authorization: Bearer YOUR_AGENTROUTER_KEY"
```

## How It Works

AgentRouter rejects requests that don't look like Claude Code. This bridge:

1. Accepts your request + your AgentRouter key
2. Strips all incoming headers
3. Injects Claude Code fingerprint headers
4. Forwards to AgentRouter with your key
5. Streams the response back

The forged headers:

- `user-agent: claude-cli/2.1.114 (external, cli)`
- `anthropic-version: 2023-06-01`
- `anthropic-beta: claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,effort-2025-11-24`
- `anthropic-dangerous-direct-browser-access: true`
- `x-app: cli`
- `x-stainless-lang: js`
- `x-stainless-os: Linux`
- `x-stainless-arch: x64`
- `x-stainless-runtime: node`
- `x-stainless-runtime-version: v24.3.0`
- `x-stainless-package-version: 0.81.0`

## Note on Hosting

Vercel's AWS IPs are blocked by AgentRouter's Aliyun WAF (captcha challenge). Render works because its IPs aren't on that blocklist.

## Files

```
server.js           # Node HTTP server (Render entry point)
api/
├── utils.js        # Shared headers, CORS, streaming
├── chat.js         # Legacy Vercel handler (unused on Render)
├── messages.js     # Legacy Vercel handler (unused on Render)
└── models.js       # Legacy Vercel handler (unused on Render)
package.json
```

## License

MIT
