# QBA — Product specification

Baseline derived from the agreed chat design. This is a requirements document, not proof of implementation. The original full prompt remains the reference for additional detail; resolve discrepancies with the user, never silently broaden scope.

## Goal
A browser-based quiz arena for classrooms: hosts create arbitrary quizzes, generate a public QR, participants join from phones/tablets/PC, play randomized 1v1 battles and advance until a champion remains. No player accounts. Knowledge should matter more than gaming skill in the default educational mode.

## Architecture (existing stack confirmed; preserve it)
JavaScript ES modules, HTML/CSS, Vite, Phaser 2D, Node.js/Express, Socket.IO, SQLite (better-sqlite3) on a persistent volume, and one authoritative service initially. Render is the current production target; Railway configuration is retained as an alternative only. Preserve existing sound implementation if different; document deviations and seek approval for major architectural changes.

## Requirements and acceptance IDs
| ID | Requirement | Minimum acceptance evidence |
|---|---|---|
| P01 | Repository and runnable platform | Clean setup, documented start/build, health endpoint, reproducible dependency install. |
| P02 | Host authentication and ownership | Secure password/session handling; unauthorized API/socket access rejected; hosts cannot access others' quizzes. |
| P03 | Customizable quiz library | Create/edit/delete/duplicate/reorder; 2–4 options, one correct, true/false, explanations, time/difficulty/damage/reward, optional images; Unicode. |
| P04 | Import/export and sample content | CSV/XLSX/JSON import validation and export; editable seed set of at least 30 general questions; no hardcoded live questions. |
| P05 | Persistence and immutable snapshots | Saved quizzes/results survive restart; active tournament unaffected by subsequent quiz edits. |
| P06 | Real rooms and QR | Public room URL and scannable QR, nickname/avatar joining, live lobby, lock/kick controls; player accounts unnecessary. |
| P07 | Real-time multiplayer | Separate clients connect; isolated rooms; server-authoritative state, validated inputs, synchronized timers and snapshots; no early answer leak. |
| P08 | Survival Quiz 2D arena | 1v1; movable characters, 2–4 answer zones, safe spawns, monsters/traps, collisions and bounded entities. |
| P09 | Question state machine | Read phase, timed battle, 0.75s hold to lock, temporary protection, resolve both answers/timeout, explanation and rewards, next question. |
| P10 | Health and rules | Default 100 HP; correct +10, wrong -25, timeout -20, monster -5, trap -10, pickup +15; configurable; educational environmental HP floor 1; arcade optional. |
| P11 | Controls and responsive UI | Keyboard, touch joystick/dash/ability, multitouch, portrait/landscape, readable question text, no clipping; physical device verification when available. |
| P12 | Match results and fairness | Educational survival eligibility then correct count, HP, correct-response time, sudden death; simultaneous elimination handled; no random winner. Safe fair paths and anti-copy options. |
| P13 | Tournament | Random pairing, simultaneous isolated matches, byes for arbitrary counts, deterministic advancement, full HP reset by default, bracket and champion; idempotent transitions. |
| P14 | Reconnection and host controls | Session recovery, grace period, forfeit rules, pause/resume/terminate, no duplicate players. |
| P15 | Spectator/projector views | Live selected arena, bracket, multiple previews, eliminated-player spectating; no hidden answers or private information; reduced preview frequency. |
| P16 | Enemies, hazards and power-ups | Bounded chasers/runners/tanks/splitters/shooters/swarm; telegraphed hazards; shield, speed, health, freeze, shockwave, auto-attack upgrades; original assets. |
| P17 | Educational analytics and review | Accuracy, response times, missed questions, separate educational/game ranking, CSV/JSON exports; practice cannot leak future questions. |
| P18 | Polish and accessibility | Distinct letters/shapes, contrast, reduced motion, sound controls, responsive text, cosmetic characters with equal default stats. |
| P19 | Deployment | Railway/Render-ready service, PORT/0.0.0.0, HTTPS/WSS, public URL, persistent DB, migrations, health check, env example, Docker/config/docs; actual deployment separately verified. |
| P20 | Security and performance | Auth/rate limits/input validation/uploads/secrets handling; target 30–50 concurrent users, bounded resources and measured load tests. |
| P21 | Robot Duel | Correct answers unlock attacks; cartoon robot damage; knowledge controls combat advantage. |
| P22 | Quiz Royale | Shared arena, shrinking playable area, fair elimination and knowledge rules. |
| P23 | Co-op Boss | Correct answers damage boss, team abilities, penalties and time limit. |

## Delivery sequence
1. Platform foundation P01–P06.
2. Playable vertical slice P07–P12 (simple enemy, trap and power-up enough for core).
3. Tournament P13–P15.
4. Polish and education P16–P18, security tests throughout.
5. Optional expansion P21–P23 only after core verified.
6. Production readiness P19–P20 (prepare deployment early; verify before classroom use).

## Design constraints needing implementation decisions
- Anti-copy in a shared arena must not create inconsistent collision geometry. Use per-player answer mapping/labels or an explicit alternative; test that hidden choices are not leaked via snapshots or spectators.
- Define a deterministic, fair sudden-death exhaustion policy before implementation. If question pool is exhausted, use a host-mediated replay/rematch policy, not a random winner.
- Define exact pause and disconnect clock semantics in DECISIONS before implementing; no disconnect advantage.
- Default classroom preset: 3 questions/match, 25s answer + 3s read + 5s feedback; 30–50 participants target, not verified capacity. Early elimination and sudden death can change duration.
