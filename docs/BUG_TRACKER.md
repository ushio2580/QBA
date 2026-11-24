# QBA — Bug tracker

Audit baseline: `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64`, 2026-11-24. Historical findings below were rechecked against the current source. `OPEN` means work remains; `REPRODUCED` distinguishes an observed failure from static-only findings. No application fixes were made during this documentation-only audit.

## Priority

P0: confirmed critical breach, data loss, tournament corruption or core outage. P1: core gameplay, unfair outcome, reconnection or significant security defect. P2: noncritical functional, QA or abuse concern. P3: cosmetic/minor issue.

## Index

| ID | Priority | Status | Summary | Evidence / requirement |
|---|---|---|---|---|
| BUG-001 | P1 | REPRODUCED | Production accepts the fixed fallback when `SESSION_SECRET` is absent/blank | `backend/server.js` secret initialization; P02/P20; Render mitigation only if applied |
| BUG-002 | P1 | OPEN | Simultaneous tied elimination favors slot B; exhausted tie uses nickname order | `continueAfterFeedback`; P12 |
| BUG-003 | P1 | OPEN | Round may start while tournament is paused during inter-round delay | `maybeAdvance`; P13/P14 |
| BUG-004 | P1 | OPEN | Sudden-death append can mutate the shared question array across simultaneous matches | `makeBracketRound` / `newGame`; P13 |
| BUG-005 | P2 | OPEN | Bye assignment does not avoid giving the same player consecutive byes | `pairPlayers` / `startRound`; P13 |
| BUG-006 | P1 | OPEN | Player-to-spectator socket role switch leaves player marked connected and bound to spectator socket | `spectator:attach`; P14/P15 |
| BUG-007 | P2 | OPEN | Integration harness hides server startup logs and reports generic health timeout | `test/multiplayer.integration.test.js`; QA reliability |

## Entries

### BUG-001 — Missing production secret falls back to a known key

- Status: REPRODUCED; fix remains OPEN.
- Priority: P1. The imported tracker initially called this P0. Audit lowered it because production exposure is unknown and the current bearer tokens are high-entropy random values whose HMAC digests are stored; the fixed HMAC key remains an unsafe configuration and must be rejected in production.
- First observed: imported static review, 2026-11-24; rechecked at HEAD `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64`.
- Expected: production startup rejects absent, blank, short, or known development-default `SESSION_SECRET`.
- Actual: `process.env.SESSION_SECRET || 'development-only-qba-session-secret-change-me'` selects the fixed default; only length is checked, and the default exceeds the threshold.
- Evidence/reproduction: ran an isolated startup with `NODE_ENV=production`, `SESSION_SECRET` omitted and a disposable SQLite path. The process passed the secret check and reached `server.listen`; it then exited with `EPERM` because this audit sandbox forbids local binds. No secret value was printed. This confirms the guard did not reject the missing variable.
- Deployment: `render.yaml` requests a generated secret, which mitigates only if the blueprint was applied and the live value is non-default. Live Render settings were not inspected; deployed exposure is UNKNOWN.
- Regression: fail before listen for missing, blank, default and short values; allow a valid unique value. Test without logging the value.
- Next: fix in an authorized implementation task, then verify the Render variable exists without reading or disclosing it.

### BUG-002 — Biased simultaneous-elimination and exhausted-tie rules

- Status: OPEN; current-source behavior confirmed, runtime scenario NOT RUN.
- Priority and requirement: P1, P12.
- Expected: survival, correct count, health, response time and sudden-death questions determine outcome without slot/name bias.
- Actual/source evidence: when both players die and `comparePlayers` returns zero, `continueAfterFeedback` sets the comparison to `-1`, awarding player B. After three sudden-death ties it picks by nickname order.
- Reproduction: equal stats, simultaneous elimination; repeat after swapping A/B slots. Separately force three exact sudden-death ties and swap nicknames.
- Root cause: fallback rules force a winner instead of providing an unbiased bounded resolution.
- Regression: winner invariant under slot/name swap; test simultaneous death and sudden-death exhaustion.
- Next: agree on a fair deterministic terminal policy if ties remain after the available question pool.

### BUG-003 — Inter-round timer advances while paused

- Status: OPEN; current-source behavior confirmed, runtime scenario NOT RUN.
- Priority and requirement: P1, P13/P14.
- Expected: pause freezes round transitions as well as active arena clocks.
- Actual/source evidence: `maybeAdvance` schedules a timeout whose callback allows both `active` and `paused` states, then calls `startRound` while paused.
- Reproduction: complete a round, pause during the rest delay, wait past the delay, inspect bracket; close during a separate delay.
- Root cause: the scheduled callback treats paused as an eligible state and is not canceled/rescheduled around pause.
- Regression: no new round until resume, exactly one transition afterward; close cancels progression.

### BUG-004 — Sudden death mutates question lists in other matches

- Status: OPEN; root cause confirmed by shared reference, runtime scenario NOT RUN.
- Priority and requirement: P1, P13.
- Expected: matches in the same round receive equivalent independent question sets; a match's sudden death cannot alter another match.
- Actual/source evidence: `makeBracketRound` creates one `questionSet` and passes the same array reference to each `newGame`; `continueAfterFeedback` appends sudden-death questions to `game.questions`.
- Reproduction: start two simultaneous matches, force one into sudden death while the other remains active, compare the other match's question count/order.
- Root cause: `newGame` retains the shared array instead of copying the list per arena.
- Regression: per-match list identity is independent; forcing sudden death in match A does not change match B.

### BUG-005 — Consecutive byes are not avoided

- Status: OPEN; source-level gap confirmed, multi-round runtime scenario NOT RUN.
- Priority and requirement: P2, P13.
- Expected: fair byes for odd rosters and avoid repeated byes whenever another eligible player can receive one.
- Actual/source evidence: `pairPlayers` shuffles every round without tracking previous bye recipients; `startRound` calls it with only current winners.
- Reproduction: deterministic five-player bracket where a first-round bye winner is drawn for the second-round bye while another player has played every round.
- Root cause: no bye history/weighting is passed into subsequent round pairing.
- Regression: no avoidable consecutive byes in 3/5/8-player brackets; no duplicate pairings.

### BUG-006 — Spectator attachment does not detach the player role

- Status: OPEN; current-source lifecycle defect confirmed, runtime scenario NOT RUN.
- Priority and requirement: P1, P14/P15.
- Expected: changing a player socket into spectator mode either retains a safe player session separately or detaches that player cleanly before the next round.
- Actual/source evidence: `spectator:attach` overwrites `socket.data.role` and joins the tournament room, but does not clear the player's `connected`/`socketId` association or leave prior rooms. Player input later requires `socket.data.role === 'player'`; state publishing still targets the stored socket ID.
- Reproduction: in a multi-round tournament, a player in the waiting area clicks “Watch another battle”; advance the bracket and try to control their next match. Also test reusing a socket to attach across rooms/roles.
- Root cause: role assignment and player membership lifecycle are updated independently.
- Regression: role change detaches or preserves player participation according to an explicit policy; no stale room subscriptions or uncontrollable “connected” participant.

### BUG-007 — Integration-test startup failures are difficult to diagnose

- Status: OPEN; test-harness behavior confirmed by source and current failed run.
- Priority: P2, QA reliability.
- Expected: startup failures show sanitized server diagnostics and cleanup waits for process exit.
- Actual/source evidence: child server uses `stdio: 'ignore'`; a random port is selected from a fixed range; a failed health poll reports only `QBA server did not become healthy.`; cleanup waits a fixed 300 ms after sending SIGTERM.
- Current run: `node test/multiplayer.integration.test.js` failed waiting for health. A separate local bind probe hit `EPERM`, so this environment could not exercise Socket.IO; logs were suppressed by the test harness.
- Regression: capture bounded/sanitized child stderr, wait for child exit, and report port-bind/startup cause while retaining isolated temp DB/credentials.

## Previously reported issue now addressed

The reported `Cannot read properties of null (reading 'map')` in tournament bracket rendering was addressed in commit `d7b2339` by building dense bracket-round arrays and normalizing null client input. `node test/core.test.js` passes the dense-array and null-normalization regression tests (7/7 total). End-to-end Socket.IO bracket serialization remains BLOCKED in this audit sandbox, so mark the runtime path implemented, not fully verified.

## Risks not promoted to bugs

- Six-digit room codes rely on the global `/api/join` IP rate limit; no per-room guessing lockout was found. Distributed guessing/fill risk is unquantified and was not reproduced.
- Render's generated secret and disk configuration are blueprint intent, not proof of live settings.
- No dependency advisory result is available because `npm audit` could not reach the registry.
