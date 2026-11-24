# QBA — Development and verification log

Append concise entries chronologically. Link actual commits and sanitized evidence; distinguish observed facts from plans. This file is a development log, not live production telemetry. Keep raw logs out of Git unless sanitized and intentionally needed.

## 2026-11-24 — Bootstrap tracking kit
- Scope: documented proposed requirements, quality protocol, state and bug tracking templates.
- Application code: not inspected or modified by this kit author.
- Verification: no application tests run; no repository supplied.
- Next: run baseline audit with Codex in actual repository.

## Entry format
### YYYY-MM-DD — Task / requirement IDs
- Commit or working-tree reference:
- Goal and actual changes:
- Affected paths:
- Checks: `actual command` → PASS / FAIL / NOT RUN / BLOCKED (brief evidence).
- Bugs opened/fixed/reopened:
- Decisions/lessons:
- Remaining work / exact restart point:

## 2026-11-24 — Public repository baseline (static review)
- Source: https://github.com/ushio2580/QBA, main; four commits shown; exact SHA not captured.
- Observed root tree, README, manifest, Dockerfile and selected server/core/client source. No application files changed.
- Git remote clone unavailable in review environment; npm/build/tests not run on repository. No runtime or deployment evidence.
- Opened BUG-001/002/003 as source findings; documented existing architecture and missing expansion features.
- Next: Codex reads actual checkout and confirms findings, runs baseline checks, records SHA and fixes one verified bug at a time.

## 2026-11-24 — Initial local audit and agent workflow initialization
- Baseline: `main`, HEAD `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64` (`Fix tournament bracket and mobile controls`). Read-only GitHub API confirmed remote `main` has the same SHA. GitHub connector is pull-only; the user handles pushes. No credentials were requested or inspected.
- Working tree at entry: no tracked modifications; pre-existing untracked `AGENTS.md`, `AGENTS.md:Zone.Identifier`, `START_HERE.md`, and `docs/`. Preserved all imports. Changes in this audit are documentation only; application files are unchanged.
- Scope: read current source, package/lock, migrations/seeds, tests, Docker/Render config, README and existing memory. Five independent read-only role reviews (gameplay, QA, security, frontend, DevOps) informed this summary; coordinator alone edited shared memory.
- Findings: BUG-001 reproduced as a production guard gap; BUG-002/003 remain source-confirmed. Added BUG-004 shared question-array mutation, BUG-005 repeated byes, BUG-006 player-to-spectator role detachment, and BUG-007 integration-test diagnostics. Runtime reproductions for BUG-002–007 remain NOT RUN. Prior bracket null-round fix has passing unit regression; socket path is not verified.
- Checks: `node test/core.test.js` → PASS (7/7); `npm run build` → PASS (40 modules; 1,929.93 kB JS / 486.24 kB gzip warning); `npm test` → BLOCKED (core file passes, integration child cannot bind local TCP; `/api/health` timeout); `node test/multiplayer.integration.test.js` → BLOCKED for same EPERM; `npm ls --depth=0` → PASS; `npm audit --json` → BLOCKED (`EAI_AGAIN`). A production-mode startup with `SESSION_SECRET` absent and temporary DB passed the secret check and reached listen, then failed only on sandbox `EPERM`.
- Deployment: `render.yaml` configures Docker, `/api/health`, `HOST=0.0.0.0`, `/var/data/qba.sqlite`, generated secret and a disk mount. The config is aligned on paper; actual Render disk/env/branch/auto-deploy/public URL and persistence were not inspected. No production smoke test or deployment occurred. Active matches are in memory and are interrupted by restart.
- Documentation updated: `AGENTS.md`, `README.md`, `docs/PROJECT_STATUS.md`, `docs/BUG_TRACKER.md`, `docs/DECISIONS.md`, `docs/PROJECT_SPEC.md`, `docs/QA_CHECKLIST.md`. No app code, CI, deployment settings, database, or source artifacts changed.
- Next step: fix BUG-001 in an authorized implementation task with missing/blank/default/short/valid-secret tests, then fix BUG-006; continue with tournament fairness/concurrency regressions. CI and physical-device/Render/load checks remain pending.
