# CASEFILES UI and persistence QA — 2026-10-21

**Release decision: NOT PASS.** This audit is incremental; a green CI run must NOT be interpreted as 100% UI coverage.

## Verified baseline

- Audited code SHA: `46780e627ce1d776d3762aba3112e172b4d3f316`.
- Uploaded source inventory: **345 static JSX control/event-handler entries across 17 TSX files** (the prior summary described 18 files; the actual CSV contains 17 unique paths).
- Prior manual production evidence maps **6 source lines (1.74%)** to actions. The reported 100 unique CI selectors / 274 calls are not a 1:1 source-to-control mapping.
- Prior green suites (not re-executed as part of repository inspection): 103 Vitest, 40 local Playwright, 6 production Playwright and 29 API checks.

## This change

1. Add targeted Playwright tests for previously unverified home and game controls and state transitions. Record source anchors only when all assertions in a test **pass**.
2. Add a TypeScript AST audit tool that compares source declarations against prior inventory counts and combines manual production evidence with passing local test evidence.
3. Emit a machine-readable `.ui-evidence/summary.json` to enumerate the proven and remaining source controls. If AST and original CSV extraction counts disagree, the percentage is **not** considered accurate until reconciled.
4. Fix a confirmed malformed-session-token bug: strict UUID validation happens before PostgreSQL's UUID cast, preventing malformed 36-character tokens from causing a spurious 503. Add regression tests. No database mutation has been performed. The code change is **not released** until review and merge.

## Product decision and known limitation

- **Player progress persists indefinitely** in Neon unless the player explicitly deletes it.
- A **14-day inactivity session TTL** is desired only for access credentials; this must never delete the player's progress.
- Current server code evicts old **in-memory** sessions after 14 days but deliberately skips the expiration check when PostgreSQL persistence is enabled. Persistent session IDs therefore remain valid indefinitely.
- The existing unauthenticated architecture uses a random UUID bearer credential stored in browser localStorage, with a local backup archive. A strict 14-day rejection without independent login/recovery credentials could strand a player who cleared local storage or changed devices.
- **No TTL enforcement change has been deployed**. First design an independent recovery mechanism (account login/recovery secret or equivalent) and verify expired-token rejection **plus** progress recovery on a QA branch.

## Acceptance checks remaining

- Inventory/test reconciliation, source-line/instance coverage across all states, disabled/conditional controls, and workflow dependencies.
- Render process restart recovery (browser reload is not process restart).
- Authentication/session expiry and security review: authorization, headers, CORS, stored XSS, backup import, request validation, rate limiting and dependencies.
- Repeatable p50/p95 production timings (not one-off latency).
- Segregation/labeling of QA rows in Neon before any deletion or data-mutation tests.
- Deployment validation after a reviewed code change.

**Do not change release readiness to PASS** based solely on an inventory scanner or the new tests. The tool reports source declaration evidence, not exhaustive runtime-state coverage.
