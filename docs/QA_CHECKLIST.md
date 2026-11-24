# QBA — Quality gates and test matrix

The gate matrix records the latest known result; checks without evidence remain NOT RUN. Use actual commands discovered in the repo and do not infer a pass from static inspection. Suggested tools if missing: Node test runner/Vitest, Socket.IO client integration tests, Playwright for browser E2E; adopt incrementally if compatible.

## Gate matrix
| Test ID | Requirement | Acceptance case | Latest result |
|---|---|---|---|
| QA01 | P01 | Fresh setup/build/start; health endpoint works. | NOT RUN |
| QA02 | P02/P20 | Unauthorized host API/socket operations and cross-owner quiz access rejected. | NOT RUN |
| QA03 | P03/P04 | CRUD, 2–4 answers, true/false, Unicode, invalid imports, round-trip export. | NOT RUN |
| QA04 | P05 | Restart retains quizzes/results; edits do not change active quiz snapshot. | NOT RUN |
| QA05 | P06 | Separate clients join same QR room; invalid code/locked room rejected; lobby updates. | NOT RUN |
| QA06 | P07 | Separate rooms isolated, authoritative state, invalid input/score rejected. | NOT RUN |
| QA07 | P07/P09/P15 | Inspect network payloads before reveal: no correct answer or confidential choice leakage. | NOT RUN |
| QA08 | P08/P11 | Keyboard/touch movement, diagonal speed, collisions, orientation and resizing. | NOT RUN |
| QA09 | P09 | 0.75s lock, one answer only, timeout, correct reveal, transition and protection. | NOT RUN |
| QA10 | P10 | HP clamps, damage cooldown, correct/wrong/timeout effects, educational HP floor. | NOT RUN |
| QA11 | P12 | Ties, simultaneous elimination, sudden-death exhaustion and deterministic results. | NOT RUN |
| QA12 | P12/P16 | Safe spawn, reachable answers, bounded enemies, mirrored/equivalent difficulty, anti-copy behavior. | NOT RUN |
| QA13 | P13 | 2, 3, 5, 8, 32 participants; no duplicate pairing, valid byes and one champion. | NOT RUN |
| QA14 | P13/P14 | Concurrent/repeated events cannot advance a match twice. | NOT RUN |
| QA15 | P14 | Reconnect within grace, expired grace forfeit, pause/resume timers, no duplicate player. | NOT RUN |
| QA16 | P15 | Host watches active matches, eliminated players spectate without answer leakage. | NOT RUN |
| QA17 | P17 | Analytics match server attempts; exports correct; review cannot expose upcoming questions. | NOT RUN |
| QA18 | P18 | Keyboard access, non-color labels, reduced motion, mute and readable UI. | NOT RUN |
| QA19 | P11/P19 | Physical Android/iOS/iPad/PC on reachable public URL; QR and multitouch. | NOT RUN |
| QA20 | P19 | Production build, PORT, HTTPS/WSS, persistent volume and restart test. | NOT RUN |
| QA21 | P20 | 30–50 concurrent simulated clients; report duration, workload, p95 latency/tick timing, disconnects, CPU/memory where measurable. | NOT RUN |
| QA22 | P21–P23 | Mode-specific gameplay and end conditions if implemented; otherwise explicitly deferred. | NOT RUN |

## Execution policy
- On each change: targeted tests plus applicable regression suite, lint/typecheck/build if defined. Run integration checks for changes to server or protocol. Run E2E for gameplay/host flow changes when environment permits.
- Before release: all core cases, security, restart persistence, real-device checks and representative load test; record blockers instead of inventing passes.
- Add new cases with stable IDs and references to BUG IDs. Keep latest result plus commit/date/command or evidence link; retain history in DEVELOPMENT_LOG.
- Use deterministic seeds/fake clocks in tests where feasible. Isolate test database/rooms. Do not test destructive paths in production.
- For ongoing verification: configure CI on push/PR once real scripts exist. Optional scheduled audit and external uptime/error monitoring require separate setup. Markdown alone does not execute tests or collect production logs.

## Regression cases added after public source review (all NOT RUN)
| ID | Related | Case | Result |
|---|---|---|---|
| QA23 | BUG-001 | Production missing/default/short secret fails startup; valid unique secret passes. | FAIL (missing secret passed guard; see current evidence) |
| QA24 | BUG-002 | Equal simultaneous deaths and exhausted sudden death: fair rule, invariant under slot/name swap. | NOT RUN |
| QA25 | BUG-003 | Pause during inter-round rest freezes advancement; resume advances once; close cancels progression. | NOT RUN |
| QA26 | P15/P20 | Audit spectator role switching, room membership, answer-related data leakage. | NOT RUN |
| QA27 | P19/P20 | Inspect committed ZIP contents safely for secrets, DBs and unnecessary binaries; no extraction into working tree. | PARTIAL (file list only; no `.env` or database paths listed) |
| QA28 | P13 | Bracket rounds are dense and client ignores sparse null rounds/malformed player arrays. | PASS (`node test/core.test.js`) |
| QA29 | P07/P11/P13 | Two real sockets verify bracket state, rival sync, server movement, dash and shield acknowledgements. | BLOCKED (test server cannot bind in audit environment) |

## Audit execution evidence — 2026-11-24

Baseline: `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64`; Node `v22.22.1`; npm `9.2.0`.

| Command/check | Result | Evidence |
|---|---|---|
| `node test/core.test.js` | PASS | 7/7 tests passed, including the bracket dense-round and null-round regressions. |
| `npm run build` | PASS_WITH_WARNING | Vite transformed 40 modules and built `dist/`; JS bundle 1,929.93 kB minified / 486.24 kB gzip exceeds the 500 kB warning threshold. |
| `node test/multiplayer.integration.test.js` | BLOCKED | Fails waiting for `/api/health`; safe server-start probe reaches `listen` then gets `EPERM` on local TCP bind. |
| `npm test` | BLOCKED | Core test file passes; Socket.IO integration cannot start under this sandbox restriction. Rerun in WSL where local binds are allowed. |
| `NODE_ENV=production` startup with `SESSION_SECRET` omitted and a temporary SQLite DB | FAIL / BUG-001 reproduced | Server passed the secret guard and reached `listen`; only the environment's `EPERM` prevented binding. No secret was printed. |
| `npm audit --json` | BLOCKED | Registry request failed with `EAI_AGAIN`; dependency advisories unknown. |
| `npm ls --depth=0` | PASS | All manifest top-level dependencies are installed. `npm ci` was not run because it would remove/reinstall the existing `node_modules`. |
| GitHub `main` SHA lookup | PASS | Read-only API returned the same SHA as local HEAD. |
| Browser/physical devices/Render/load | NOT RUN | No browser framework or device run; no Render dashboard or production settings were accessed; no load run. |

The integration test's SQLite path is isolated in a temporary directory and its test credentials are synthetic. Its child stdout/stderr are suppressed, its port is randomly selected from a fixed range, and cleanup waits a fixed 300 ms after SIGTERM; see BUG-007. No production DB, secrets, deployment, or user data were accessed.
