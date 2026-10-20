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

## CASEFILES 0.5 — Investigation Expansion (20 features)

All twenty requested systems are available in the **Детективски инструменти** tab. These are fictional game mechanics and early prototypes, not real forensic analysis or navigation.

| # | Feature | Implementation |
|---|---|---|
| 1 | Fingerprint comparison | Three-choice visual pattern exercise, evidence-gated |
| 2 | Audio analysis | Synthetic waveform and timestamped sound-event exercise; not recorded audio |
| 3 | UV inspection | Simulated UV hotspot identification exercise |
| 4 | Deleted file recovery | Reconstruct an in-story three-fragment note |
| 5 | Investigation map | Schematic map for four fictional case locations |
| 6 | Source reliability | Classify direct observations, witness testimony and hypotheses |
| 7 | Red herrings | Identify and reject an unsupported guilt inference |
| 8 | Additional witnesses | Security guard and building porter provide gated contextual statements |
| 9 | Decision log | Timestamped server-tracked actions in the active session |
| 10 | Unlockable locations | Locations become available only after specific evidence |
| 11 | Map-based alibi | Puzzle checking whether phone contact proves physical presence |
| 12 | Suspicion scores | Independently adjustable and stored personal suspicion sliders |
| 13 | Difficulty | Rookie / Detective / Expert change hint allowance (3/2/1) and hint penalties (2/4/6) |
| 14 | Achievements | Eight calculated badges for investigation milestones |
| 15 | Tutorial | Four checkable introductory investigation steps |
| 16 | Local save backup | Portable JSON export and validated import of evidence, deductions, notes, transcripts, journal, attempts and settings |
| 17 | Investigation history | Per-session accusation attempts and decision chronology |
| 18 | Hidden rating | Resolution-grade summary is visible only after a solved case |
| 19 | Different endings | Outcome label for continuing investigation, proven accusation and full disclosure; no alternate playable chapters yet |
| 20 | Automated browser testing | Playwright Chromium desktop/mobile smoke tests configured in GitHub Actions |

**Portable backup:** GET `/api/backup` exports the current authenticated save; POST `/api/backup/restore` validates JSON against the game's known evidence and relationships, imports into an **empty new session** and recreates a completed report only if the restored clues justify it. Imported saves intentionally cannot send paid OpenAI requests. JSON save files contain player-written notes and transcripts; keep them private. As a single-player game, locally edited saves are not cryptographically signed and can be tampered with.

**Persistence:** Render still reports `storage: memory` without `DATABASE_URL`. The export/import flow provides manual recovery across restarts, not automatic saving. The optional PostgreSQL storage remains the recommended long-term solution.

**E2E tests:** `npm run test:e2e -w apps/web` requires Playwright Chromium installed locally. The GitHub CI pipeline installs it and executes two browser checks. A passing Render build alone does not prove GitHub's browser job has passed.

## CASEFILES 0.6 — Immersive Investigation

A new **Интерактивно разследване** navigation tab provides an additional fully scripted, in-session investigation workspace (no paid AI calls):

- **Interactive rooms and object inspection:** entrance hall, living room and work desk with selectable hotspots and rotatable object close-ups. Objects are 2D CSS illustrations, not photogrammetric 3D.
- **Inventory and gated objects:** collect five tools. The brass key unlocks a desk drawer containing a photographic negative; office papers are accessible after uncovering the message clue (E04).
- **Combine physical clues:** magnifier + negative explains the photograph; UV lamp + paper fragment reveals the coded clue. Wrong or missing combinations are rejected by the backend.
- **Visual combination puzzle:** a three-dial lock can only be solved once the code clue is discovered. Correctness and completion are validated server-side.
- **Branching interviews:** additional choices for Martin, Elena and Petar adjust trust and may be blocked by prior choices or missing evidence. The branching dialogue is deterministic and separate from the optional AI interviews.
- **Simulated police computer:** search fictional access, camera, financial, telephone and forensic records. A record is returned only when its prerequisites have been collected. Nothing is fetched from real police databases.
- **Session state:** tools, inspected objects, combinations, dial completion, trust, dialogue history and number of archive searches are included in PostgreSQL serialization and validated portable backups.
- **Regression coverage:** unit tests cover object requirements, combinations, trust, dialogue gating, secure record access and backup recovery; the HTTP smoke test exercises the full progression. Playwright adds browser navigation, inventory and terminal checks.

**Limitations:** This is a richer 2D interactive prototype rather than fully 3D gameplay, and forensic mini-games remain fictional simulations. The existing case narrative, clues and final server-side verdict are not replaced. Local portable backups are player-controlled and not cryptographically signed; do not rely on them as cheat-resistant server records. Render reports \`storage: memory\` until \`DATABASE_URL\` is configured for PostgreSQL, so session state can otherwise be lost after a restart.

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
