# QBA Agent Kit v2 — para el repositorio existente

Basado en la revisión pública parcial de https://github.com/ushio2580/QBA del 24 de noviembre de 2026. No sustituye el código de tu juego ni contiene cambios a la aplicación. No se ejecutaron pruebas reales.

1. Crea una rama local o guarda tus cambios existentes sin borrarlos.
2. Copia AGENTS.md y docs/ a la raíz de QBA. Si ya tienes archivos de memoria, fusiona las entradas sin perder historial; no sobrescribas ciegamente.
3. Abre el repositorio real en Codex, inicia una sesión y pega el siguiente prompt.

## Primer prompt

Read AGENTS.md and docs/PROJECT_STATUS.md. This is an existing advanced QBA repository. Reconcile the partial public review against current HEAD and uncommitted changes. Preserve existing code, architecture, data and records. Verify BUG-001 through BUG-003 from source; reproduce safely with tests. First establish the baseline using npm ci, npm test, npm run build, and an isolated database and ports where needed. Record exact commands, results, commit SHA, and blockers. Update project memory only in this initial audit; do not change application code, deploy or push. Recommend the smallest next fix.

## Para continuar después

Follow AGENTS.md. Read the current status and relevant open bugs. Fix the highest-priority confirmed issue or requested task with a minimal change and a regression test. Run applicable checks, review the diff and update project memory with real evidence. Do not rebuild or change the stack. Stop after three unsuccessful attempts on the same issue and report the blocker.

## Automatización

AGENTS.md guía cada sesión; no se ejecuta solo. Pide a Codex añadir CI compatible con el repositorio después de comprobar los scripts. Los tests deben usar una base aislada. No configurar deploy ni tocar producción sin autorización. La prioridad es estabilizar Survival Quiz antes de agregar modos.
