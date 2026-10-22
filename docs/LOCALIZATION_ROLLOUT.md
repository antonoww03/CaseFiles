# CASEFILES multilingual rollout

## Requested languages

Default: **English (en)**. Supported user choices: **Български (bg)**, **Deutsch (de)**, **Français (fr)**, **Polski (pl)**, **Español (es)**.

The language selection is separate from session save data and persists under `casefiles-language`. Switching languages must **never** reset cases, evidence, progress, co-op membership, or custom stories. Valid language codes are allowlisted. Legacy Playwright tests explicitly select Bulgarian, so release defaults can safely change without rewriting game scenarios.

## Status — work in progress

The current branch implements the locale provider, the visible selector, translated landing and primary navigation, translated Co-op/editor UI controls, English metadata and regression coverage for switching all six languages. The translations use the original Bulgarian phrase as the lookup key during migration. Missing keys currently display the original Bulgarian string. **This is deliberately a draft and must not be merged as a complete localization.**

**Do not claim the game is fully translated.** At present most story dialogs, generated cases, investigative side modules, backend messages, user-facing cinematic cutscenes and narrative records still originate from Bulgarian sources.

## Required before production launch

1. Extract all source strings from **every** `apps/web/src` module and all `apps/api/src` generated response content. Run `npm run i18n:audit` for a source-level inventory. Review lines manually because names, user-generated text and comments can legitimately contain Cyrillic.
2. Replace static phrase-based IDs with stable semantic translation IDs before expanding translations beyond the starter glossary.
3. Finish validated catalogs for all six languages: every button, label, form field, menu, accessibility name, placeholder, modal, notification, story introduction, puzzle prompt, witness statement, evidence description, case ending and forensic report.
4. Add backend locale negotiation (strictly allowlisted header; en default) for API-delivered game text and errors. Preserve IDs, puzzle solutions, validations, case logic and persisted states independent of presentation language.
5. Distinguish authored game copy from user-generated community stories: never silently translate a player's submitted text or change stored evidence/author content.
6. Ensure localized render of Case 001 and Case 002 from start to finish, classic modes, 1.0–1.7 add-on components, Detective Universe, Community, Co-op and editorial experiences. Verify English-first from clean storage.
7. Use locale-aware punctuation, responsive layouts and accessible labels for long Polish/German/French text. Ensure the 320px mobile HUD and co-op controls are not clipped.
8. Test fresh session, switching language mid-session, returning to home, reload, restart restore, two users in one Co-op room with different UI languages and the same authoritative game state.
9. Record translation completeness per locale and module. Every required string should have an actual translation; falling back to Bulgarian in other locales is an actionable launch blocker.
10. Run targeted i18n tests and the existing CI suite. Review gameplay/story consistency before merging and deploying.

### Non-negotiable rule

Language is a **presentation preference**, not a game progress setting. Do not translate or mutate stored case identifiers, authored community content or the machine-readable solution fields. Any language mismatch should fail the localization QA, not be hidden by a generic 'PASS'.
