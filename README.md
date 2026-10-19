# CASEFILES

A noir detective investigation game for the web.

## Development

Monorepo with a React/Vite frontend and an Express/TypeScript API. Case #001 is a development vertical slice with scripted interviews. Real AI interrogation, durable database sessions, and production deployment are not available yet.

### Run locally

Requires Node.js 20.19+ and npm 10+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API listens on http://localhost:3001. Copy `apps/api/.env.example` to `apps/api/.env` if you need custom ports or origins.

```bash
npm run typecheck
npm test
npm run build
```

Story material is fictional. Repository content currently includes development-only case logic and should not be treated as a secure location for unreleased story spoilers.
