# QBA — Bug tracker

Initial audit baseline: `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64`, 2026-11-24. BUG-001 was repaired in a follow-up starting at `b226721a7d1887c2bc0c96f91446d6fe4b84acf9`; other findings remain open unless noted. `OPEN` means work remains; `REPRODUCED` distinguishes an observed failure from static-only findings.

## Priority

P0: confirmed critical breach, data loss, tournament corruption or core outage. P1: core gameplay, unfair outcome, reconnection or significant security defect. P2: noncritical functional, QA or abuse concern. P3: cosmetic/minor issue.

## Index

| ID | Priority | Status | Summary | Evidence / requirement |
|---|---|---|---|---|
| BUG-001 | P1 | VERIFIED | Production rejects missing/default/short session secrets before SQLite initialization | `backend/config.js`, `backend/server.js`, `test/config.test.js`; P02/P20; live Render setting remains unknown |
| BUG-002 | P1 | OPEN | Simultaneous tied elimination favors slot B; exhausted tie uses nickname order | `continueAfterFeedback`; P12 |
| BUG-003 | P1 | OPEN | Round may start while tournament is paused during inter-round delay | `maybeAdvance`; P13/P14 |
| BUG-004 | P1 | OPEN | Sudden-death append can mutate the shared question array across simultaneous matches | `makeBracketRound` / `newGame`; P13 |
| BUG-005 | P2 | OPEN | Bye assignment does not avoid giving the same player consecutive byes | `pairPlayers` / `startRound`; P13 |
| BUG-006 | P1 | OPEN | Player-to-spectator socket role switch leaves player marked connected and bound to spectator socket | `spectator:attach`; P14/P15 |
| BUG-007 | P2 | OPEN | Integration harness hides server startup logs and reports generic health timeout | `test/multiplayer.integration.test.js`; QA reliability |
| BUG-008 | P1 | OPEN (reported, not reproduced) | Match sometimes appears stuck after the first correct answer; Player 2 sometimes cannot move | local two-player gameplay; P07/P09/P11 |

## Entries

### BUG-001 — Production session secret fallback

- Status: VERIFIED locally; the Render environment variable remains unverified.
- Priority: P1. The initial audit lowered this from imported P0 because live exposure was unknown and session tokens are high-entropy random values; requiring a configured production key remains necessary.
- First observed: 2026-11-24; fixed in the working tree during follow-up from baseline `b226721a7d1887c2bc0c96f91446d6fe4b84acf9`.
- Root cause: missing `SESSION_SECRET` selected a fixed development key whose length passed the production guard. The guard ran after SQLite migrations and startup updates.
- Fix: `resolveSessionSecret` rejects absent, blank, under-32-character, development-default, and `.env.example` placeholder values in production. Server validation runs before SQLite opens. Development/test behavior retains the fallback; configured values are not rewritten.
- Evidence: `node test/config.test.js` PASS (5/5), including production rejection cases, valid configuration, local fallback, and a child-process startup check proving a missing secret does not create the SQLite file. Error messages do not include secret input.
- Regression: retain these tests and add a Render configuration check only when it can be performed without reading or sharing the value.
- Deployment implication: before deploying this fix, confirm a unique `SESSION_SECRET` is already configured in Render. If absent, the new server will fail early without touching SQLite. Keep an existing secret unchanged to preserve sessions.

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

### BUG-008 — Intermittent match freeze / Player 2 cannot move

- Status: OPEN; user-reported, not reproduced. No root cause confirmed.
- Priority: provisional P1 because it can block the core multiplayer match.
- Report: first question appears to answer correctly; the match sometimes then freezes, and Player 2 sometimes reports that movement stops.
- Known evidence: static review found no direct cause in the normal question transition. Player movement is accepted only when the socket role is `player`, the tournament is active, and the game phase is `ACTIVE`; locked players are intentionally immobile until the next question resets `lockedAnswer`. BUG-006 provides a plausible role-transition failure if Player 2 entered spectator mode between rounds, but that does not explain a freeze within the same match by itself.
- Test gap: the original integration case used one question and sent no answer. It has now been extended to use two questions, move both clients into Q1's correct zone, and check both clients receive Q2 and can move. The updated test has not completed a network run in this environment.
- Reproduction: run the updated `node test/multiplayer.integration.test.js` in local WSL. Then create a quiz with at least two questions and start two distinct browser clients/devices. Complete Q1 correctly, wait through feedback and Q2 activation, and move each player independently. Record `matchId`, phase/question number, both `self.locked` values, socket connect/disconnect and attach events, and before/after coordinates. Do not log player tokens.
- Regression: the updated integration case covers server state/position for two sockets after Q1. Add role-change coverage if Player 2 watched another match; physical touch control still needs a separate browser/device run.
- Limitation: this audit environment blocks local TCP binds, so the updated integration scenario only received syntax/static review here. Do not change the game state machine until it reproduces or stronger evidence identifies a cause.

## Previously reported issue now addressed

The reported `Cannot read properties of null (reading 'map')` in tournament bracket rendering was addressed in commit `d7b2339` by building dense bracket-round arrays and normalizing null client input. `node test/core.test.js` passes the dense-array and null-normalization regression tests (7/7 total). End-to-end Socket.IO bracket serialization remains BLOCKED in this audit sandbox, so mark the runtime path implemented, not fully verified.

## Risks not promoted to bugs

- Six-digit room codes rely on the global `/api/join` IP rate limit; no per-room guessing lockout was found. Distributed guessing/fill risk is unquantified and was not reproduced.
- Render's generated secret and disk configuration are blueprint intent, not proof of live settings.
- No dependency advisory result is available because `npm audit` could not reach the registry.
