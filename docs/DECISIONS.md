# QBA — Decisions and durable lessons

Initial entries describe agreed product direction / proposed defaults, not verified implementation. Keep significant decisions and confirmed lessons here. Do not silently override user intent.

| ID | Status | Decision and rationale | Consequences |
|---|---|---|---|
| DEC-001 | Product requirement | Dynamic quiz editor and persistence; teachers must change questions without code edits. | Database CRUD, ownership checks, immutable tournament snapshots. |
| DEC-002 | Proposed | Single authoritative Node/Socket.IO service; lightweight Phaser client. | Start with one game-server instance; coordinate state before horizontal scaling. |
| DEC-003 | Product requirement | Educational fairness is default. | Environmental HP floor, knowledge-aware winner rules, feedback after questions, separate rankings. |
| DEC-004 | Accepted | Render is the current production platform; preserve its single Docker service and persistent SQLite disk. Railway config is an optional alternative, not the production target. | Verify the live disk, `DATABASE_PATH`, `PUBLIC_BASE_URL`, generated secret, branch and auto-deploy settings manually; no production changes or access to secrets during audit. |
| DEC-005 | Proposed | Core Survival Quiz before additional game modes. | Avoid unfinished modes masquerading as playable features. |
| DEC-006 | Workflow rule | Evidence-based statuses and regression tests. | Logs preserve context; actual code/tests remain source of truth. |

## Confirmed lessons
- DEC-007 (observed architecture, 2026-11-24): current package uses Node ESM, Vite, Phaser, Express, Socket.IO, better-sqlite3; Docker uses Node 22. Preserve existing implementation instead of migrating unnecessarily.
- DEC-008 (observed architecture): single server owns in-memory active games; SQLite persists saved data. Restart interrupts live matches; no independent replicas until coordination exists.
- DEC-009 (proposed workflow): test and stabilize current Survival mode before new modes; use actual scripts and existing Node test runner. No new framework just to perform initial audit.
- DEC-010 (observed discrepancy): lockfile is present even though README describes absence; verify documentation against current HEAD. Do not infer test success from lockfile.
- DEC-011 (confirmed checkpoint, 2026-11-24): the bracket API emits dense round arrays and the client normalizes malformed/null rounds. The current unit suite covers serialization and null normalization; the Socket.IO integration regression remains unverified in this execution environment.
- DEC-012 (confirmed checkpoint, 2026-11-24): dash and shield use discrete `game:action` events with server-side cooldown validation and state feedback. Preserve authoritative validation; end-to-end behavior still needs a real Socket.IO test.
- DEC-013 (confirmed fix, 2026-11-24): validate production `SESSION_SECRET` before opening or mutating SQLite. Reject missing, blank, short and known placeholder values; preserve configured bytes so a deployment does not rotate existing sessions. Keep the development fallback only outside production. Evidence: `node test/config.test.js` passes 5/5; the live Render setting still needs a safe manual check.
- DEC-014 (user-approved workflow, 2026-11-24): test and stabilize a complete local two-player match before testing the online deployment. A report of an intermittent post-answer freeze and Player 2 movement failure must be reproduced locally before changing the game loop or deploying a speculative fix.

## New entry template
### DEC-XXX — Title
- Date / status (proposed, accepted, superseded):
- Context and alternatives:
- Decision / rationale:
- Evidence and consequences:
- Related requirements/bugs/tests:
- Supersedes (if any):
