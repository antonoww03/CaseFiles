# CASEFILES

A browser-based detective investigation game with a fictional, fixed case, free-form interviews and evidence-driven accusations.

## Live test environment

- Game: https://casefiles-game.onrender.com
- API health: https://casefiles-api-9wz5.onrender.com/api/health

The demo has twelve pieces of evidence and three suspects. All case content is fictional. Development case rules and some story details are present in this public repository; this is not spoiler-safe distribution.

## Development

Requires Node.js 20.19+ and npm 10+.

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173
API: http://localhost:3001

```bash
npm run typecheck
npm test
npm run build
```

The API build also runs an offline end-to-end smoke test with a temporary test server.

## Optional live AI interviews

The game works without an API key. In that case, interview responses use a deterministic, scripted demonstration. If a backend `OPENAI_API_KEY` is configured, the server generates character replies using OpenAI Responses API with structured output. The server controls evidence discovery, character context, conversation history and the final verdict. The model does not determine the murderer, the evidence or the result. AI-generated dialogue is probabilistic and may still make mistakes.

For local development, copy `apps/api/.env.example` to `apps/api/.env`. Set `OPENAI_API_KEY` there if required. The local API reads this file on startup.

For the Render test deployment, add `OPENAI_API_KEY` under the **casefiles-api** service's Environment settings, not the static website, not Vite build variables, and never in source control. Optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`). Restart or deploy the service so it picks up changes.

`GET /api/health` reports `ai-live` only when an API key is configured; actual failed requests fall back to scripted replies and are marked `scripted-demo` in the API response and the UI. The backend limits AI requests to 25 per session, 60 per IP per hour, and 300 per server process per day. These are temporary in-memory protections, not billing guarantees; set a strict project budget and usage alerts in the OpenAI API dashboard before enabling a publicly accessible instance. API usage is billed separately from ChatGPT subscriptions.

## Current limitations

- Case sessions, interview history and request quotas are stored in RAM and are lost on a server restart or cold redeployment.
- AI dialogues are grounded by character instructions and evidence access, but still require adversarial evaluation; do not claim perfect factual consistency.
- There is no authentication, user accounts, persistent database or private unpublished scenario engine yet.
- Only one case exists and the final verdict uses deterministic server-side criteria.
- The production Render free service may have cold-start delays.

This repository is a development vertical slice, not a production-ready game.
