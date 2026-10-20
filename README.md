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

## CASEFILES 0.7 — Living Investigation

The **Живо разследване** section contains fifteen new game systems:

| # | Game system | 0.7 implementation |
|---|---|---|
| 1 | Search warrants | Evidence-gated, reputation-dependent fictional permits for the office archive and service entrance |
| 2 | Chain of custody | Server-recorded source, fictional officer, location, timestamp and lawful flag for newly acquired evidence |
| 3 | Expert opinions | Medical, video and financial written analyses; must have prerequisite clues and take another game action to become available |
| 4 | Confrontations | Elena's phone contradiction and Martin's invoice discrepancy; evidence-dependent |
| 5 | Reputation | Persistent 0–100 score affected by procedural choices and warrant handling |
| 6 | Dynamic events | Additional phone signal, witness and anonymous letter triggered at game actions 3, 6 and 9 |
| 7 | Consequences | One-time procedural choices can close a confrontation path irreversibly within the current session |
| 8 | Forensic clock | Five progression phases; **not** a real-time waiting mechanic |
| 9 | Financial trail | Four fictional transactions with flagged anomalies; detailed audit requires office warrant |
| 10 | Courtroom | Submit a set of authenticated evidence on the financial or chronological route; simulated prosecutorial review |
| 11 | Admissibility | Server checks record provenance and fictional permits for protected E09/E10 evidence |
| 12 | Suspect secrets | Dossiers reveal hidden contextual facts only after defined confrontation and expertise |
| 13 | Alternative paths | Financial and temporal evidentiary paths can independently satisfy the court game rules |
| 14 | Case editor | Session-local, validated JSON templates with exactly 3 suspects, 5–8 evidence records and an adjudicated solution; downloadable JSON |
| 15 | Case #002 | **Изчезналият архив**, a distinct playable mini-case: Plovdiv archive, 3 new suspects, 6 clues, gated interviews, accusation and a separate solution |

The original Case #001, previous mechanics and its verdict remain playable independently. The second case and the custom case editor are a **story framework/mini-case** rather than a fully illustrated three-room 0.6-quality production story.

New progress persists with the session when PostgreSQL is enabled, and is included in the portable backup schema. Existing Case #001 evidence collected **before** the update may not have a historical acquisition record; the system does not invent one. A manual player-controlled save can be edited and must not be mistaken for immutable audit evidence.

**All warrants, prosecutor decisions, finance records and crime events are fictional in-game simulations, not a statement of Bulgarian legal process or connected police/banking data.**

## CASEFILES 0.8 — Quality & Immersion

All 0.7 gameplay modes remain available. New **Кинематографичен свят** tab contains:

1. **2.5D scene:** CSS perspective, layered rooms, pointer-dependent camera tilt, three scene selections, zoom, interactive descriptive hotspots (game evidence is still collected in the established interactive investigation screen).
2. **Illustrated characters:** vector-like CSS portraits for Martin, Elena and Petar with neutral/sad/nervous/angry facial-expression variations.
3. **Cinematic dialogues:** typewriter text reveal, branch choices saved on the server, prerequisite clue checks, one-time choices and irreversible refusal paths.
4. **Sound:** a user-activated, generated rain ambience based on Web Audio. No sound plays automatically; no downloaded audio required.
5. **Victim smartphone:** gated message threads, email, last call, photo, notes, and a reconstructable deleted fragment based on prior evidence. Fictional data stays server-side until unlocked.
6. **Extended Case #002:** six named localities, three narrative chapters, choices with consequences; the original 0.7 Case #002 evidence and accusation flows remain in the case library.
7. **Story branches:** financial/document and camera leads, plus a risky unsubstantiated confrontation that closes a line of inquiry.
8. **Visual case editor:** text fields and repeatable clue cards for custom cases, with suspects, required evidence and correct resolution; JSON is no longer required.
9. **Detective profile:** per-session XP, level, statistics and milestone badges calculated from real saved progress in both cases.
10. **Automatic saving and recovery:** the browser periodically exports a portable session snapshot to localStorage, and will attempt to import the matching snapshot after a known session is lost due to a Render restart. Data is stored **on that device and browser only**, and cannot guarantee recovery on a cleared cache, blocked storage, or across different devices.
11. **Performance and mobile:** the heavy 0.7 and 0.8 panels load on demand using React.lazy. New components implement responsive breakpoints and reduced-motion support.
12. **Browser regression:** Playwright tests cover the 2.5D camera, phone gating, profile, chapters and visual editor as well as existing features.

**Important limitations:** These are illustrated interactive prototypes, not realistic 3D models, motion-captured animations or recorded cinematic cutscenes. The audio is procedurally synthesized, not a professional sound library. The game still needs more authored narrative scenes and artwork to feel like a finished release. No subscription AI requests are necessary for these features.

**Database:** The backend already supports persistent PostgreSQL sessions when \`DATABASE_URL\` is supplied. A free Render database \`casefiles-db\` is available, but the connector does **not expose** its password or internal connection URL and therefore this update does not silently link it. The free instance is due to expire on **2026-11-18** unless renewed/upgraded. Until connected, Render continues to use memory storage plus local snapshots; don't confuse local autosave with cross-device PostgreSQL persistence.

## CASEFILES 1.0 — Full Game Experience

**The default home screen is now a cinematic 1.0 case-selection menu.** Start a new game, continue a local session, choose Case #001 or Case #002, adjust intro/reduced-motion preferences, or open the classic tools. Older mechanics and saved sessions remain available.

New visual assets: original hand-authored SVG scenes in \`apps/web/public/art/\`, showing apartment 407 and the fictional archive. These are original **illustrated 2D game scenes** with cinematic layout, not photographs, true 3D environments, recorded footage or pre-rendered video.

The **1.0 game screen** unifies scene exploration, evidence dossier, a real forensic workbench, logical deduction links, scripted character interrogation, a gated phone, puzzle progression and an accusation/final report. In Case #001, the new evidence screen directly calls the established deduction API, and the forensic tab includes the existing full CCTV + document analysis so these do not require a legacy panel. Optional classic tools remain in reach for deeper investigation and older progress.

Case #002 receives six selectable narrative locations, original archive art, three new **server-validated** investigation puzzles (key record, video timeline, contract trace), gated witness interviews and a final accusation requiring at least four found clues plus two confirmed puzzles. It has varied epilogues based on the number of accusation attempts, verified puzzles and irreversible interrogation choices. The earlier Case #002 routes remain compatible.

**Quality and limitations:** Use \`npm test\`, \`npm run build\`, \`node scripts/smoke.mjs\` and \`npm run test:e2e -w apps/web\` for automated checks. The new 1.0 smoke test verifies locked evidence, solved puzzles and portable backup recovery. Playwright covers the default title screen, scene, dossier, mobile navigation and second-case gating. The game remains an illustrated browser detective adventure, not a photorealistic AAA game; narrative scenes use text and transitions, not full-motion cinematics or recorded voice acting.

**Storage:** Database connection settings remain **unchanged**, as requested. Render may continue using in-memory sessions and browser-local autosave until PostgreSQL is connected separately. Local data does not automatically synchronize across devices. No AI key or GitHub comments are required by the new features.

## CASEFILES 1.1 — Living Crime Scene / Interactive Gameplay

This version adds **15 connected visual/gameplay improvements**, based on the 1.0 default cinematic game screen. All prior classic tools remain available:

1. **Distinct environments** — ten individually authored SVG room illustrations at \`apps/web/public/art/rooms/\`, including a living room, study, entrance, medical area, archive reading room, server room, security desk, hall, elevator and restoration studio.
2. **Use items directly in the scene** — investigate hotspots, find the brass key and apply it directly to the drawer; combine magnifier with the negative, or UV lamp with hidden writing. Each action is checked by the backend.
3. **More expressive conversations** — visual suspect portraits, typewriter-style answers, choices tied to evidence; case 002 now exposes irreversible story decisions alongside its interrogation.
4. **Investigation wall** — place movable evidence cards on a corkboard, choose two records, submit their relationship for server validation and display string lines for confirmed conclusions.
5. **Object inspector** — rotate, zoom, flip and examine physical evidence; unseen back-side details and instrument prerequisites are verified by the API.
6. **Evidence discoveries** — on-screen discovery feedback and gentle animation after game actions.
7. **Investigation journal** — combined clue, archive, interrogation and important game-event entries derived from the current session.
8. **Persistent consequences** — meaningful case-one and archive choice flags from earlier versions now exposed directly where they affect interrogation.
9. **Story events** — contextual reveals and an event notification that responds to investigation progress.
10. **Crime reconstruction** — draggable-equivalent reorderable chronological event cards (keyboard-accessible move buttons), playback highlighting and authoritative chronology check.
11. **Adaptive hints** — advice based on unresolved available puzzles, with added prompt after an extended period without new progress.
12. **Branch-dependent endings** — the prior 1.0 conclusion routes remain tied to discovered evidence and earlier mistakes.
13. **Voice notes** — unlocked fictional narratives can be spoken by the browser through the local Speech Synthesis API. These are synthesized summaries, **not actual witness recordings**.
14. **Forensic tools** — key, magnifier and UV applied through a unified on-scene interface; existing fingerprint, CCTV and forensic labs remain accessible in the same game.
15. **Travel map** — location-based scene selection with prerequisite checks and scene-specific art.

Server endpoints \`GET /api/experience11\` and \`POST /api/experience11/action\` surface derived, non-spoiler game state and enforce possession, prior discoveries, evidence custody and valid in-world deduction links. Existing session fields and portable save files contain the required state: **no schema or database connection changes were made**.

**Important representation:** the scenes are original vector illustrations, **not photorealistic 3D rooms**. Rotating a clue is a stylized 2.5D simulation, not a scanned 3D object. The archive/audio and NPC content remains scripted rather than dynamically acted or recorded, and browser Speech Synthesis voice quality depends on available system voices. The complete game's fiction is not a real police archive. Some legacy mini-games and rich document viewers continue to use their existing UI within the unified game.

**Regression validation:** added unit tests for locked clue interactions, key/UV tool use, verification of deduction links, protected audio text and location gates, extended end-to-end API smoke, and Playwright tests covering real keyboard/mouse/touch-style interactions in the case-one and case-two flow.

## CASEFILES 1.2 — Director's Cut

The **1.0 main menu is intentionally preserved**. Director's Cut changes the investigation after clicking Start:

- **Cinematic acts:** five authored, evidence-gated story beats per case, a fullscreen illustrated cinematic view, room-specific visuals and transitions. Server state is never advanced merely by opening or reloading the frontend.
- **Branch choices:** four evidence-dependent choices per case (phone handling / financial or CCTV priorities; archive log handling / document or footage priorities). Contradictory decisions are mutually exclusive, with the authoritative choices written into the existing persisted \`game09.events\`.
- **Expressive protagonists:** six individually authored SVG-based character portraits, named and labeled accessibly, with emotional facial variants. These are hand-designed vectors rather than external AI likenesses.
- **Detailed props:** six original SVG close-up illustrations for phone, invoices, negative, CCTV, key and archive records in \`apps/web/public/art/props\`. Rotate/zoom and jump to the relevant evidence tools.
- **Adaptive audio:** on-demand generated quiet/rising/tense musical drone and per-scene audio cue. No autoplay, voice-cloning, subscription, or external audio library.
- **Gameplay integration:** the scene director, props and portraits are embedded in the unified 1.0 game rather than duplicating the old tools. Existing CCTV, evidence board, interactive inventory, court, interview branches and puzzles remain.
- **UX:** reduced-motion CSS support, accessible dialog titles, responsive scene stages and portrait layouts.
- **QA:** server unit tests check scene prerequisites, unrevealed twists, exclusive choices and persistence; HTTP smoke covers forbidden shortcuts and portable save restoration; Playwright exercises opening scene, close-up interaction, branching consequences, portraits and mobile Case #002.

**Boundaries:** This is a narrative/visual upgrade to a stylized 2D browser game, **not** full-motion 3D, film-quality animation, a professionally recorded soundtrack or a complete rewrite of the mystery. The new director mechanics cover pivotal beats rather than replacing every line of existing story dialogue. No database schema or Render database configuration was changed, as requested.

## CASEFILES 1.3 — Detective's Instinct

The **cinematic main menu remains unchanged**. The game now includes a first-class **Детективски режим** tab and a contextual active-investigation objective strip shared by both stories.

- **Point-and-click continuity:** Existing clearly illustrated room objects and inventory tools are still selectable directly. The new active objective points to the relevant scene/action; players do not have to search through technical tools to advance.
- **Evidence-based reasoning:** Five new server-verified exercises per case: a factual logic question, interrogation contradiction, evidence comparisons and a theory. Every answer is validated against the current session's actually discovered clues, and unavailable questions do **not** leak answer options or story text.
- **Side-by-side comparison:** Select two *discovered* clues, view their artwork and grounded descriptions, then choose an evidence-based conclusion. Two images are a viewing aid, not automatic proof of the answer.
- **Contradiction challenges:** Present the telephone log against Elena's denial or the signed spare-key record against Boris's alibi. Wrong assertions give feedback and are recorded, but do not automatically end the case.
- **Theory building and revision:** Distinguish proven events from hypotheses and avoid unsupported claims of identity. Errors count in the journal; the correct explanation is revealed only after a verified answer.
- **Five chapter milestones:** Thematic investigation progression with a concise location-aware objective and short optional tutorial steps. These are **progress-based**, not elapsed-time timers.
- **Case Review:** After an existing case is genuinely solved, an epilogue shows confirmed and missed challenges, mistakes and consequential branch choices. Until then it remains locked.
- **Replayability:** New Game+ is unlocked through the already implemented API, never by mutating a result from the browser.
- **Visual regression:** Desktop and narrow-screen Playwright flows exercise every game tab, attach Chromium screenshots to GitHub Actions artifacts and assert images load and navigation works. Screenshot collection is **not** golden-image pixel-diff baseline testing; human art-direction review is still useful.
- **Compatibility:** Progress for these ten challenges uses existing, capped `expansion.actions` records and is restored through the already supported portable backup format. No database, persistent session schema or AI integration changed.

Technical sources: `apps/api/src/detective13.ts`, `apps/web/src/Detective13.tsx`, `apps/web/tests/detective13.spec.ts`.

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


## CASEFILES Community 0.5 — Co-op & Creator Expansion

This add-on preserves the later CASEFILES 1.x interface, story content and legacy tools. It extends the already playable Case #002 with a separate server-authoritative **community investigation hub** accessible from the main menu; it does **not** synchronize the entire original Case #001 3D/2D game interface between users.

Five features:

1. **Case #002** — the existing authored "Изчезналият архив" is available as a room-based shared mini-investigation with clues, alibi interviews and evidence-based accusations.
2. **Multiplayer/co-op rooms** — invitation code, up to six investigators, room membership tokens, shared discovery and verdict state, four-second client polling, rate limits and server-side evidence checks. There is no account login or real-time voice/chat.
3. **Procedural cases** — randomized fictional setting, character roster, clues and a hidden culprit generated server-side from a seed. These are variations on a curated template, not AI-written unlimited narratives.
4. **Detective progression** — optional private UUID-based profile, 100 XP per newly solved room, levels and milestone badges, with idempotent rewards.
5. **Community editor** — visual editing of 3 suspects, 5 clues, alibis, narrative and adjudicated solution; anonymous public publishing and a browsable community-case library. Content entered by players is public, not professionally moderated, so never include private personal information.

### PostgreSQL persistence

The API initializes **casefiles.sessions** and **casefiles.community_records** when a valid \`DATABASE_URL\` is configured. Rooms, public stories, profiles and existing investigation sessions are written to PostgreSQL using parameterized queries; concurrent room/profile updates use version-checked writes to avoid lost state. PostgreSQL game saves no longer expire simply because they have been inactive for two weeks. Existing in-memory sessions without a database still expire after fourteen days and do not survive a restart.

**Current Render limitation:** the connected Render tooling can inspect the existing \`casefiles-db\` database but does not reveal its database password or internal connection URL. Merely creating the DB and committing PostgreSQL-aware code does not connect it. Until the Render API web service has its \`DATABASE_URL\` set to the internal connection URL of \`casefiles-db\`, \`/api/health\` and \`/api/community/status\` will truthfully report \`storage: memory\`. No placeholder connection URL is used. The currently provisioned free database reports expiry on **2026-11-18**, and must remain provisioned for data to remain accessible.

To connect it using Render's dashboard: open the existing \`casefiles-db\` database and copy its **Internal Database URL**, then set \`DATABASE_URL\` under **casefiles-api → Environment**. Render automatically redeploys the web service when environment is updated. Never commit that URL or share it publicly. Confirm that both status endpoints report \`postgres\` and verify a room/profile survives restarting the backend. This database wiring cannot be considered deployed until those checks pass.

### Verification

- \`npm run build -w apps/api\` executes TypeScript compilation, Vitest and an isolated API HTTP smoke test.
- \`apps/api/src/community.test.ts\` verifies random-case structure, clue gating, concealed solution and supported verdict logic.
- \`scripts/smoke.mjs\` verifies profile XP, invite/join, membership protection, shared evidence, procedural rooms and public-story publishing using **in-memory test data**; \`DATABASE_URL\` is deliberately unset in the smoke child process to prevent test fixtures from reaching production PostgreSQL.
- \`apps/web/tests/community.spec.ts\` provides Playwright Chromium UI coverage of community navigation, co-op code joining, shared clue refresh, profile creation and publishing. A passing Render build does **not** establish a passing Playwright run.


## CASEFILES 1.4 — Investigation Desk (profiling, news and case archive)

The primary CASEFILES 1.x game adds **Следствено бюро** next to Detective Mode. This feature complements the already implemented 0.5–1.3 evidence timeline, forensic mini-games, scripted branching interviews, gated victim phone, schematic investigation maps, witness trust, consequences, achievements, alternate endings, court review and visual case creator; those earlier features are not duplicated.

- **Evidence-based profiling:** profiles for all six suspects across the two authored cases. Each requires both independent, currently discovered clues before a conclusion is shown. One discovered supporting clue may be submitted to verify the fully unlocked profile. The text distinguishes motives, contradictions and timelines from proof of guilt. It does not purport to make psychiatric diagnoses.
- **Fictional newsroom:** article teasers unlock as each case advances. A story describing a resolved case is not visible until the server records a solved verdict. After the verdict, the player selects one irreversible editorial stance: factual reporting (+5 reputation), witness privacy (+3) or sensationalism (-12). The chosen headline and effect are saved server-side.
- **Investigation archive:** current progress, clues and accusation attempts for both cases and any custom case are shown together. Existing Detective Mode, New Game+ replay, simulated courtroom and case editor can be opened from this new screen.
- **Live game events:** pre-existing evidence-gated story developments now appear alongside the newsroom.
- **Persistence and recovery:** confirmed profiles and editorial choices reuse the existing capped server-side \`game09.events\` history, serialized in sessions and portable backups. This avoids a destructive database migration and preserves existing saves. Permanent cloud persistence **still requires** a valid PostgreSQL \`DATABASE_URL\` on the Render API; local snapshot recovery is not cloud synchronization.
- **Routes:** \`GET /api/desk14/:caseId\` and \`POST /api/desk14/:caseId/action\`, both require an existing session. Input and evidence ownership are validated server-side, requests are rate-limited, and mutations are rolled back if a database save fails.
- **Checks:** \`apps/api/src/desk14.test.ts\` covers spoiler prevention, evidence gating, immutable editorial choice, reputation and independent progress for the two cases. Run \`npm run typecheck && npm test && npm run build\`, plus the Playwright suite, before releasing.

New cases and profile rules remain manually authored, not automatically validated real-world forensics or AI-generated facts.
