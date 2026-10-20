# CASEFILES

A browser-based detective investigation game, built with React/Vite and Node/Express.

- [Playable demo](https://casefiles-game.onrender.com)
- [API status](https://casefiles-api-9wz5.onrender.com/api/health)

## Case #001: Последното обаждане

A fictional investigation set in Sofia. Players can inspect an interactive crime scene, examine forensic reports, interview three suspects, organize a clue timeline, form deductions by linking evidence and file an accusation supported by evidence and reasoning.

The final verdict is decided by deterministic server rules. AI does not decide who is responsible, create evidence or alter the case's chronology.

## CASEFILES 0.3 features

- **Notebook**: create, edit, search and delete up to 35 notes per session. Categories include hypotheses, leads and questions.
- **Suspect dossiers**: biographies, initial alibis, relations with the victim, linked discovered evidence and interview counts.
- **Alibi verification**: server-verified findings require all named evidence, with an explicit distinction between established contradictions and leads that only warrant additional investigation.
- **Three-room scene**: living room, work area and entrance, with five interactive scene evidence hotspots.
- **Visual Evidence Board**: view collected evidence on an investigation board, connect cards with drag-and-drop or click selection; connections and confirmed deductions are validated server-side.
- **Detective score**: the final accusation response includes a reproducible score with categories for evidence, deductions, interviews, verified alibis and resolution. Incorrect or insufficient outcomes are capped below 50.
- **Progress storage**: notebook entries and verified checks are included in the existing optional PostgreSQL session serialization.

No new API keys, paid services or accounts are needed for these features. The existing **OpenAI API integration is optional**; scripted interviews work without it. New content uses existing evidence and does not generate new clues or alter the solution.

**Known limitation:** In the current deployment, `/api/health` still reports `storage: memory` until `DATABASE_URL` is configured. All server-side progress, including notes and checked contradictions, can therefore be lost when the backend restarts.

## CASEFILES 0.4 — Forensic Update

- **Interactive CCTV analysis:** two illustrated, timestamped frame sequences (not recorded video files). Scrub and step through timestamps, examine available visual details and submit a frame observation. The backend decides whether E06 or E07 is earned; direct discovery is blocked.
- **Document examination:** investigate pages of a fictional financial draft and entry-access report. E09 and E10 now require opening the right documents and inspecting their relevant pages. Merely clicking on the corresponding evidence ID does not grant them.
- **Progressive evidence discovery:** E08 also requires the initial scene protocol and phone clue (E01 and E03). Existing case facts, witness testimony and deterministic verdict rules remain unchanged.
- **Interrogation strategies:** neutral, empathy and challenge affect a bounded server-side pressure value. Evidence-led challenge can unlock a more direct scripted response. The interview screen defaults to **scripted-only mode** so using it never requires an OpenAI key or incurs model usage.
- **Hints:** up to three server-side hints per session; hint count and last hint are saved. Each used hint reduces the final detective score.
- **Sealed final report:** only an adequately supported, correct accusation unlocks the complete event sequence, known/omitted evidence and a scored report. The report survives session restoration when PostgreSQL storage is configured.
- **Validation:** the API build runs unit tests and an HTTP smoke test including video/document gating, interview strategy, hints, session state and final report access.

None of the forensic content represents real CCTV or real people. The correct solution remains in the public repository source code; a future production version needs a private story-content backend to prevent out-of-game spoilers.

## Local development

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

The API build runs unit tests and an offline HTTP smoke test. Real AI diagnostics are opt-in only; regular builds never need the OpenAI API and do not incur API usage.

## AI interviews

Without `OPENAI_API_KEY`, interviews use deterministic scripted replies. With a key present, requests are sent to the OpenAI Responses API and can fall back to scripted dialogue on failure.

To enable:
1. Create a valid API key in the OpenAI Platform dashboard. API usage is billed separately from ChatGPT subscriptions.
2. In the **casefiles-api** Render service, set `OPENAI_API_KEY` in Environment to the unquoted key value, without a `Bearer ` prefix.
3. Optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`).
4. Save and redeploy; do not put the key in Vite/frontend configuration or this repository.
5. Set a conservative API project budget and usage alerts.

`GET /api/health` returns `ai-configured` when a key is present, **not** confirmation that the provider accepted it. Successful interview responses carry `mode: ai-live`; provider failures return `mode: scripted-demo`. Provider diagnostics log only HTTP status and a sanitized error code. `401 invalid_api_key` means the configured key must be corrected or replaced, not that the application needs a new model.

The server limits AI usage to 25 attempted requests per session, 60 per IP per hour and 300 globally per server process per day. These in-memory limits are not a billing guarantee.

## Persistent sessions

The backend includes optional PostgreSQL persistence for collected evidence, deductions, interview history and interrogation counters. It works in `memory` mode until `DATABASE_URL` is configured.

A separate **casefiles-db** free-tier PostgreSQL instance exists in Render. Its free service currently expires **2026-11-18**; move or upgrade the data before then if you want lasting saves.

To connect it securely:
1. Open the Render dashboard for **casefiles-db**, then **Connect** and copy its **Internal Database URL**. Do not share it in chat.
2. Open **casefiles-api** → **Environment** and set `DATABASE_URL` to that complete internal connection string.
3. Save and redeploy.
4. Confirm `GET /api/health` reports `storage: postgres`. The API will initialize a private `casefiles.sessions` table automatically.

Render and Supabase/fitness-tracker data are isolated; CASEFILES does not use any FitnessTracker tables.

Without `DATABASE_URL`, sessions remain in process memory and are lost on restart or redeploy. Sessions expire after 14 days of inactivity in the current implementation, including when persistence is enabled.

## Tests and diagnostic switches

- `npm run test -w apps/api`: unit tests
- `npm run build`: build and offline API smoke checks
- `node scripts/live-interview-check.mjs`: two real API requests, only when an API key is configured. May incur usage charges.
- `CASEFILES_RUN_LIVE_TEST=yes`: optional live check during the API build; always return to `no` after the one-off check.
- `CASEFILES_RUNTIME_PROBE=yes`: optional live test on API startup; always return to `no` immediately afterward.

Do not enable either diagnostic switch permanently.

## Current limitations

- The story and correct suspect can be inspected in this public repository. Future production content should move into a private content service.
- AI roleplay can produce factual inconsistencies despite controlled prompts; additional evaluations are needed.
- The crime scene is currently a stylized 2D exploration panel rather than a finished illustrated environment.
- Sessions are anonymous bearer tokens without player accounts; account-based saves and multi-device sync are not implemented.
- The free database has a limited lifespan. Implement backups before using it for important data.
- Current deduction and accusation rules are designed for this first case and need further balancing.
