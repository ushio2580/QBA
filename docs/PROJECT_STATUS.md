# QBA — Current project status

Last audited: 2026-11-24. The earlier imported status was based on a partial static review; this entry supersedes that baseline while preserving its historical notes in `docs/DEVELOPMENT_LOG.md`.

## Repository baseline

- Repository: `https://github.com/ushio2580/QBA`; branch: `main`.
- Exact HEAD: `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64` (`Fix tournament bracket and mobile controls`).
- Local HEAD and `origin/main` matched at audit start. A read-only GitHub API lookup confirmed the same commit SHA on remote `main`; the connected GitHub integration reports pull-only permission. The user owns pushes.
- No tracked changes existed at audit start. Pre-existing untracked imports were `AGENTS.md`, `AGENTS.md:Zone.Identifier`, `START_HERE.md`, and `docs/`. They were preserved. This audit modifies documentation only; application source remains unchanged.
- Environment: Node `v22.22.1`, npm `9.2.0`; installed top-level packages match the manifest. `package-lock.json` is tracked.

## Architecture

- Frontend: Vite, vanilla JavaScript ES modules, Phaser 3 renderer, responsive CSS in `src/`.
- Backend: one Node/Express service with Socket.IO authoritative game state in `backend/server.js` and pure helpers in `backend/core.js`.
- Persistence: SQLite via `better-sqlite3`; numbered migrations and 30-question seed template in `db/`.
- Deployment: Docker on Render per `render.yaml`; Node 22; server binds configured `HOST` and `PORT`; health endpoint `/api/health`; same-origin Socket.IO; SQLite path `/var/data/qba.sqlite` matches the declared disk mount.
- Runtime model: completed records and quizzes persist in SQLite; active rooms/matches are held in process memory and are interrupted by restart. Do not scale to independent replicas.
- There is no `.github/workflows/` CI workflow. The existing two ZIP archives contain source/config files only according to their central-directory listings; no environment file or database was listed. `.dockerignore` excludes `.env`, `data/`, `node_modules/`, and build output.

## Feature inventory

`VERIFIED` applies only to the specific tested behavior in the evidence column, not to an entire requirement unless the acceptance case is covered.

| ID | Area | Status | Evidence and remaining work |
|---|---|---|---|
| P01 | Runnable platform | IMPLEMENTED_UNVERIFIED | Node/npm, installed dependencies, lockfile and production build verified. Clean `npm ci`, server health and production startup were not verified. |
| P02 | Host authentication/ownership | IMPLEMENTED_UNVERIFIED | Password/session and ownership code exists. BUG-001 shows missing production secret is accepted; auth/ownership integration cases are absent. |
| P03 | Quiz editor | IMPLEMENTED_UNVERIFIED | CRUD/editor code exists; no browser CRUD, Unicode or round-trip test. |
| P04 | Seed/import/export | IMPLEMENTED_UNVERIFIED | Unit test verifies at least 30 valid editable seed questions. CSV/XLSX/JSON import/export behavior is not tested. |
| P05 | Persistence/snapshots | IMPLEMENTED_UNVERIFIED | SQLite migrations and quiz snapshot code exist; no isolated restart-persistence or active-snapshot test. |
| P06 | Rooms/QR/lobby | IMPLEMENTED_UNVERIFIED | Room-code, URL, QR and lobby paths exist; integration test has not reached health in this sandbox; no device QR test. |
| P07 | Real-time multiplayer | IMPLEMENTED_UNVERIFIED | Authoritative socket/game code and one two-player integration scenario exist. Network execution is blocked here; isolation, reconnect and answer-payload tests remain absent. |
| P08 | Survival arena | IMPLEMENTED_UNVERIFIED | Playable code path has movement, answer zones, one chaser type and spike hazards. Full match play and device physics were not tested. |
| P09 | Question flow | IMPLEMENTED_UNVERIFIED | Server phases, answer locking and feedback code exist; lock/timeout/resolution acceptance tests are absent. |
| P10 | Health/rules | IMPLEMENTED_UNVERIFIED | Educational/arcade rule code exists; environmental HP floor and damage boundary tests are absent. |
| P11 | Responsive controls | IMPLEMENTED_UNVERIFIED | Keyboard, joystick, dash/shield actions and portrait/landscape CSS are present. No browser viewport or physical-device test. |
| P12 | Winner fairness | IMPLEMENTED_UNVERIFIED | Helper tie-break unit tests pass. BUG-002 remains in simultaneous elimination and sudden-death exhaustion. |
| P13 | Tournament | IMPLEMENTED_UNVERIFIED | Dense bracket serialization regression passes unit tests. Full bracket, repeated-bye, round-isolation and pause regressions remain open. |
| P14 | Reconnection/host controls | IMPLEMENTED_UNVERIFIED | Reattach, 30-second grace and pause/resume code exists; not covered by executable integration tests. BUG-003 and BUG-006 remain. |
| P15 | Spectator/projector | IMPLEMENTED_UNVERIFIED | Multi-arena previews, bracket and selection code exist. Role switching has BUG-006; no spectator payload or browser test. Preview is a simplified DOM arena, not the Phaser renderer. |
| P16 | Enemies/hazards/power-ups | IN_PROGRESS | Current slice has a chaser, warning spike traps, dash and shield. Other enemy types, power-up drops and destructible props are absent. |
| P17 | Analytics/review | IN_PROGRESS | Ranking, analytics and CSV export paths exist. Missed-question review and safe practice mode are absent; no analytics/export test. |
| P18 | Accessibility/polish | IN_PROGRESS | High-contrast, reduced-motion, larger-text preferences and letter labels exist. Sound controls, explicit colorblind mode, complete focus/dialog handling and device validation are missing. |
| P19 | Render deployment | IMPLEMENTED_UNVERIFIED | Blueprint configures Docker, health path, generated secret, public URL input and SQLite disk. Actual Render service settings, disk attachment, URL, WebSocket and persistence are unknown. |
| P20 | Security/performance | IN_PROGRESS | Several input/auth controls exist, but BUG-001 and BUG-006 are open; npm advisory audit and 30–50 client load test are blocked/not run. |
| P21 | Robot Duel | TODO | Not implemented. |
| P22 | Quiz Royale | TODO | Not implemented. |
| P23 | Co-op Boss Battle | TODO | Not implemented. |

## Verified checkpoint improvements

The latest user checkpoint contains the earlier bracket/mobile fixes: the server creates dense bracket-round arrays, the frontend filters null/malformed rounds, dash and shield are separate server-validated actions with cooldown state, and mobile layout/control styles were expanded. Unit tests cover bracket serialization/normalization; an integration test now covers bracket state and dash/shield acknowledgements but could not run here.

## Audit checks and evidence

| Command/check | Result | Evidence / limitation |
|---|---|---|
| `git rev-parse HEAD`, `git status --short --branch`, recent log | PASS | SHA above; `main...origin/main`; no tracked modifications at entry, imported files untracked. |
| Read-only GitHub API lookup of `main` | PASS | Remote SHA equals local HEAD; no credentials requested or inspected. |
| `node -v && npm -v` | PASS | Node `v22.22.1`, npm `9.2.0`. |
| `npm ls --depth=0` | PASS | All top-level packages installed. `npm ci` was not run because dependencies were already present and it would remove/reinstall `node_modules`. |
| `node test/core.test.js` | PASS | 7/7 tests passed. |
| `npm run build` | PASS_WITH_WARNING | Vite transformed 40 modules and built successfully. JavaScript chunk is 1,929.93 kB minified / 486.24 kB gzip, above the 500 kB warning threshold. |
| `node test/multiplayer.integration.test.js` | BLOCKED | Waited for `/api/health`, then failed. A safe isolated server-start probe reached `listen` and received `EPERM`; this environment forbids local TCP binds. |
| `npm test` | BLOCKED | Core test file passed; integration test failed at startup for the same bind restriction. This is not evidence that Socket.IO acceptance passes or fails in WSL. |
| Production startup with `NODE_ENV=production`, no `SESSION_SECRET`, temporary DB | REPRODUCED | It passed the secret-length guard and reached `listen`, then failed only because bind is denied. BUG-001 reproduced without printing a secret. |
| `npm audit --json` | BLOCKED | npm registry lookup failed with `EAI_AGAIN`; dependency advisories remain unknown. |
| Browser/device/Render/restart/load checks | NOT RUN | No browser automation, physical-device run, Render dashboard, production test, or load test was performed. |

## Deployment and manual checks

`render.yaml` requests a 1 GB disk mounted at `/var/data`, sets `DATABASE_PATH=/var/data/qba.sqlite`, asks Render to generate `SESSION_SECRET`, and requires `PUBLIC_BASE_URL` to be supplied. This is configuration evidence only; the live Render dashboard was not accessed. Before classroom use, the user should verify the deployed commit, Render service branch/auto-deploy state, disk mount and plan, database path on the mounted disk, a non-default generated secret, `PUBLIC_BASE_URL=https://<service>.onrender.com`, registration setting, `/api/health`, WSS connection, and that a saved quiz survives a redeploy. Do not share environment values.

## Prioritized next work

1. Fix BUG-001 and add production-secret startup tests before broader use; confirm the live service already has a unique secret without exposing it.
2. Fix BUG-006 role/socket detachment before relying on player-to-spectator transitions.
3. Add regression tests for BUG-002, BUG-003, BUG-004 and BUG-005, then exercise 2/3/5/8-player brackets in a WSL environment that permits local sockets.
4. Add CI using existing `npm ci`, `npm test`, and `npm run build`; keep deployment separate and user-gated.
5. Run mobile browser/device, Render persistence/WSS, and representative 30–50 client load checks. Do not start additional modes until Survival Quiz and tournament paths are verified.
