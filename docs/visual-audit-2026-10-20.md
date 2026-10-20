# CASEFILES — Complete Visual and Hotspot Audit
Review: 2026-10-20. Scope: every scene and gameplay tab, both cases, legacy modes, original repository artwork, Chromium browser checks.

## Confirmed issues
- CRITICAL / living: Работна лампа was a marker near 78%,36%, with no legible lamp in the room SVG. Root cause: interactive definitions and art were authored separately.
- HIGH / living: Библиотека was not visually aligned with its marker.
- HIGH / desk: Заключено чекмедже, Разпилени бележки, Метална кутия had logical interaction without specific illustrated item silhouettes.
- HIGH / entrance: Изтривалка marker was not anchored to a recognizable doormat.
- HIGH / Case #002: reading protocol, server terminal, security log, corridor CCTV, lift cart and studio contract used generic markers.
- HIGH / older modes: 0.3, 0.6, 0.8 and 0.9 scenes independently drew abstract furniture and scattered hotspots.
- MEDIUM / legacy dossier and cinematic suspects: placeholders/initials did not match character designs across tabs.
- MEDIUM / varying scene aspect ratios: CSS cover-crop could move the underlying picture away from percentage-based hotspots.

## Fixes applied
1. Each of the six canonical physical props now has a dedicated SVG in apps/web/public/art/objects and a matching x/y position in apps/api/src/immersive.ts.
2. Central registry apps/web/src/sceneArt.tsx maps room -> object or clue -> specific art -> coordinate. All modern/legacy scene components reuse it.
3. Aspect ratio 16:9 in source SVG and interactive view; shared sceneArt.css supplies object silhouette, keyboard focus, inspected state, Detective Vision and mobile styles.
4. New SVGs for lamp, bookshelf, doormat, drawer, papers, safe, phone, evidence, terminal, logbook, cctv, cart, contract and footprint.
5. Interactive physical illustrations for all six Case #002 rooms: reading contract, server terminal, security logbook, corridor camera, lift cart, studio contract.
6. CASEFILES 0.3 Expanded Scene, 0.6 Immersive, 0.8 Cinematic World, 0.9 scene and 1.0+ main scene now use common room art and item assets instead of unrelated geometric furniture.
7. Character dossiers and cinematic portraits now use the named, expressive Director12Portrait illustration for each character.

## Tab-by-tab audit
| Tab | Artwork and interactive rendering | Outcome |
| --- | --- | --- |
| Main menu | existing two cover illustrations, readable CTA | preserved unchanged |
| Case 001 / living | lamp, bookshelf, phone, scene report | foreground illustrations and anchors corrected |
| Case 001 / desk | drawer, papers, safe | distinct physical items and verified coordinates |
| Case 001 / entrance | doormat, access records | visual mat + documented access evidence anchors |
| Case 001 / medical | evidence sheet on laboratory background | visible evidence foreground asset |
| Case 002 / reading | archive protocol | visible contract on desk |
| Case 002 / server | reboot event | visible terminal |
| Case 002 / security | key access | visible logbook |
| Case 002 / hall | CCTV clue | visible camera |
| Case 002 / lift | cart clue | visible wheeled cart |
| Case 002 / studio | document clue | visible contract |
| Evidence and Board | SVG evidence strings, evidence cards, documents | no missing external media dependency; labels retained |
| Interview and dossier | six illustrated character portraits | unified appearance across current and legacy modes |
| Digital and phone | CSS smartphone, phone prop SVG, locked entries | linked image loading and unlocking covered in tests |
| Forensics and puzzles | simulated CCTV, analysis cards, forensic props | existing interactive representations retained |
| Final report | text-first evidence/decision panel, cinematic verdict | no missing images, interaction tests retained |

## Tests and limitations
- apps/web/tests/visual-audit.spec.ts: all 33 local SVG image URLs, desktop lamp/bookcase sizes and loading, all major investigation tab screens, and case-two mobile clue anchors.
- Prior Playwright suites still cover inventories, interview branches, phone, forensic analysis and verdicts.
- Automated tests cannot prove subjective illustration quality for every scene at every physical screen size; a manual design review remains valuable.
- No PostgreSQL/database, player-data migration, external AI, or Render configuration was changed.

Final CI and Render status should be taken only from a matching commit's run, not from earlier successful runs.