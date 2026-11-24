# Quiz Battle Arena — Repository Agent Instructions (v3)

## Mission
Build and maintain a real, reusable, responsive multiplayer educational game. Act as developer, reviewer and QA engineer. Prefer the smallest verified improvement over large rewrites. Follow `docs/PROJECT_SPEC.md` and the user's current request. Never treat a plan, mockup, or untested code as a working feature.

## Existing repository baseline (2026-11-24)
This is an existing project, not a greenfield build. Repository: https://github.com/ushio2580/QBA. The user develops locally with Codex, deploys to Render and handles GitHub authentication and pushes manually. The 2026-11-24 initialization audit inspected checkpoint `d7b2339c84d47060b3f39ac6d03d3f254e4e4a64`; GitHub `main` matched via a read-only API check. See `docs/PROJECT_STATUS.md` for working-tree and verification evidence, and re-establish the SHA for each future task. Preserve the existing infrastructure; Render is the production target unless the user explicitly changes it. Keep the existing Vite/vanilla JS/Phaser frontend in `src/`, Express/Socket.IO/SQLite backend in `backend/`, migrations and seeds in `db/`, and Node tests in `test/`. Preserve `package-lock.json` and the deployment configurations. No rewrite, framework migration, destructive database reset, or reinitialization to match the original prompt. The repository and user-approved requirements take precedence over stale descriptions; document discrepancies instead of silently undoing working changes.
Known scripts: `npm ci`, `npm test`, `npm run build`, `npm run server`, `npm run dev`, `npm start`. Discover current scripts before executing; do not run `db:seed` against production. Use Node 22 for alignment with Docker, temporary SQLite files, disposable ports and safe test credentials. No live production test or deployment without authorization. Verify installed Node version and current package/Docker/Render requirements before choosing a runtime; do not change it merely to match this historical baseline.
The earlier public review was partial and static. The 2026-11-24 local audit rechecked BUG-001/002/003 and recorded new findings in `docs/BUG_TRACKER.md`; use that file and fresh source/tests rather than the earlier conclusions. Treat features as unverified until actual acceptance evidence exists. Read open BUG entries before adding features. Prioritize a complete, reliable Survival Quiz tournament on real devices over new modes.

## Start every task
1. Read this file and `docs/PROJECT_STATUS.md`. Read the relevant portions of `docs/PROJECT_SPEC.md`, `docs/QA_CHECKLIST.md`, open issues in `docs/BUG_TRACKER.md`, and relevant recent log/decision entries; do not reread the entire historical log unless necessary.
2. Inspect the actual repository: `git status --short`, recent commits if available, relevant files, package scripts, tests and current architecture. Preserve user changes. Discover commands from the repository; do not invent them.
3. If the baseline is unknown, perform an evidence-based audit before marking features complete. For an audit-only request, do not change application code.
4. Select the requested task or highest-priority unblocked dependency, define acceptance criteria and scope. If no task is specified, choose one from the status file. Do not reimplement already verified behavior.

## Git, local development and agent coordination
- At initialization record `git rev-parse HEAD`, branch, working-tree status and recent commits. Check the configured origin and upstream without exposing credentials; fetch only when permitted, then compare local and remote commits. A cached remote-tracking ref is not proof of a successful push. If GitHub access fails, continue locally and record the limitation.
- The user owns authentication and performs commits and pushes manually by default. Do not request, read, print, store, copy or transmit their PAT, passwords or credential-store contents. Never embed a token in a remote URL, command, documentation or log. Use existing Git authentication only for authorized operations. A local commit does not require a GitHub token.
- Do not commit, push, merge, deploy or change remote settings unless explicitly authorized. Never force-push, rewrite history, reset branches, discard uncommitted changes or automatically merge divergent branches. Review `git diff` and staged changes; report conflicts and suggest a commit message. Keep secrets, private databases, credentials and sensitive logs out of Git.
- Git history and actual code are implementation evidence; current user-approved requirements define intended behavior; passing relevant tests establish verification. Version project memory alongside code. Do not infer that a push updates other worktrees automatically.
- If native subagents are available, delegate scoped independent read-only reviews (QA, multiplayer, security, frontend) when useful. The main coordinator integrates evidence and is the sole writer of shared memory files. For explicitly authorized parallel coding, isolate work in separate branches/worktrees and coordinate overlapping files before edits; never run competing writers in the same working tree. Otherwise use sequential review roles. Do not claim background agents are running without evidence.

## Render production and CI safeguards
- Render is the current production platform. Preserve working settings and inspect `render.yaml`, Dockerfile, build/start scripts and environment variable names before proposing changes. Do not switch hosting, alter billing or change production configuration without approval.
- Keep local, test and production data and environments separate. Use disposable SQLite databases, ports and credentials for tests. Verify whether Render has persistent storage and whether the production SQLite path is actually on the mounted disk. Do not assume persistence from configuration alone. If inaccessible, record NOT RUN/BLOCKED and explain how the user can verify it. Never seed, reset, migrate destructively, or access private production data without authorization.
- Review binding to `0.0.0.0` and `PORT`, public join URLs and QR codes, HTTPS/WSS, Socket.IO proxy/reconnect behavior, health checks, graceful shutdown and session-secret validation. Never disclose production environment values. A restart or redeploy may interrupt in-memory matches; avoid deployment during active tournaments.
- A push to the Render-linked branch may trigger production auto-deploy. Confirm the actual branch and auto-deploy setting with evidence or ask the user to check. Recommend temporarily disabling auto-deploy during onboarding, then using CI-gated deployment when available and correctly configured. Do not assume these settings have been applied.
- Inspect existing `.github/workflows/` before proposing CI. Use real package scripts, lockfile and runtime requirements. Recommend PR/push checks for tests, production build and relevant regression checks; add CI only in an authorized implementation task, not the initial audit. Do not weaken checks to obtain a passing result. No automatic deployment or production smoke tests without authorization. Sanitize CI artifacts/logs and use short retention where appropriate.

## Implementation and review loop
- Reproduce reported bugs before fixing when feasible; identify root cause rather than masking symptoms. Create or update a BUG entry. Reuse its stable ID for failed attempts, root cause and evidence; check prior attempted fixes before trying again.
- Establish a relevant baseline test. Add a regression test for a bug whenever feasible; explain if not possible.
- Make minimal coherent changes; respect existing conventions and dependencies. Do not rewrite unrelated modules, delete working features, or change architecture without a clear reason and user approval for major changes.
- Run targeted tests, then applicable broader lint/typecheck/build/unit/integration/E2E checks using the actual scripts. Review the diff for regressions, security, fairness, accessibility and scope. Use independent review if available; otherwise perform a separate self-review pass.
- If a check fails, capture the evidence, investigate, repair and rerun. Do not disable, weaken or delete tests simply to get green results. After three unsuccessful repair attempts on the same issue, stop that loop, document findings and blocker; do not repeat the same approach blindly.
- Finish only when acceptance criteria are verified or limitations explicitly documented. Never fabricate test output, performance results, screenshots or real-device validation. Distinguish PASS, FAIL, NOT RUN and BLOCKED.

## QBA invariants
- Quizzes are database-driven, editable by their authenticated owner; sample questions are seed data, not gameplay constants. Snapshot quizzes on tournament start.
- Server owns answers, timers, movement validation, health, collisions, results, matchmaking and bracket progression. Never trust client claims or leak correct answers before reveal.
- QR codes use a real reachable public URL in production. No localhost public join links. Players join without accounts; hosts authenticate. Validate sockets and ownership on every privileged event.
- Educational mode: knowledge matters most, environment alone cannot eliminate; reveal correct answer plus explanation. Keep educational ranking separate from tournament placement.
- Keep match rooms isolated. Resolve wins, ties, byes, disconnects and duplicate events deterministically. Avoid spectator or opponent answer leakage. Preserve mobile touch and desktop controls.
- Use bounded enemy/entity counts, safe spawn positions and accessible answer zones. Keep stable physics independent of device resolution.
- No secrets or personal data in source, logs or examples. Do not run destructive commands, deploy, alter paid resources or push commits without authorization. Test against isolated databases and rooms.

## Memory contract — update before ending a task
- `docs/PROJECT_STATUS.md`: update only affected requirement IDs, evidence, blockers and next task; never mark VERIFIED without evidence. Keep the summary compact and current.
- `docs/BUG_TRACKER.md`: create/update stable BUG IDs, reproduction, root cause, fix, tests, and status; link recurring issues instead of duplicating them. Close only after verification.
- `docs/DEVELOPMENT_LOG.md`: append one concise dated entry per meaningful task with baseline SHA/branch, change, affected files, commands/results, unresolved issues, deployment implications and next step. Preserve prior entries. No full console dumps or secrets; reference sanitized artifacts if needed.
- `docs/DECISIONS.md`: record significant decisions and durable lessons with reason, consequences and evidence. Do not add speculative rules or silently change product requirements. Supersede rather than erase previous decisions.
- `docs/QA_CHECKLIST.md`: update coverage or evidence only if tested; add new regression cases for important defects.
- If a session stops halfway, record unfinished work and exact restart point before ending when possible. Use Git diff/history as evidence; logs are not a substitute for actual code.

## Status vocabulary
`UNKNOWN` = not inspected; `TODO` = confirmed missing; `IN_PROGRESS` = incomplete work; `IMPLEMENTED_UNVERIFIED` = code exists, no sufficient test evidence; `VERIFIED` = relevant acceptance tests passed; `BLOCKED` = prerequisite/environment prevents work; `DEFERRED` = explicitly postponed. Reopen VERIFIED if a regression is discovered. Never infer completion from screenshots, filenames or checkboxes alone.

## Final report
Briefly report: completed task and evidence, changed files, checks run/results, remaining bugs/blockers, updated memory files and recommended next task. State explicitly what could not be verified (e.g. physical devices, deployment, load). Avoid repeating the whole specification.

## First session after replacing this file
- Reconcile imported docs with the latest local repository, including changes since the preliminary public review. Do not assume features are missing or complete based on the old plan. Record the exact audited SHA and any uncommitted changes. Preserve all existing history; if required memory files are missing, report them and initialize only missing files during an authorized documentation audit.
- Audit application code and existing tests read-only, run safe checks in isolated environments, re-evaluate historical bugs, and update documentation only. Report test failures as baseline findings; do not silently fix app code or CI in this session.
- Distinguish locally verified behavior from deployment, physical-device and load-test evidence. List the next smallest actionable task, prioritize confirmed security and multiplayer defects, and wait for the user to authorize implementation.

## Scheduled or audit-only runs
When asked to audit, inspect and run non-destructive checks, update status/bugs/log, and report findings; do not silently deploy or perform broad repairs. The markdown file is instructions, not a daemon. Continuous monitoring requires CI, scheduled execution or an external observability system configured separately.
