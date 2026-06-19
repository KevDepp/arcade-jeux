# Réponse Manager — Watchdog AG stall (T-003) (2026-02-25)

Constat: le run `ag-T-003_ui-ux-review-ag-366a7dde8efd486a` a bien `ack.json`, mais **pas de `result.json`** et **pas de heartbeat**.

Décision: **retry la tâche avec `developer_antigravity`** (nouveau thread/conversation forcé par l’orchestrateur).

Consignes pour le retry:
- Mettre à jour `data/AG_internal_reports/heartbeat.json` **toutes les 5 min** (au minimum) pendant la revue navigateur.
- Si période “browser-only”, définir `stage="browser"` + `expected_silence_ms` (ex: 600000).
- Produire le RESULT atomique: `result.tmp` -> `result.json` dans le nouveau dossier `data/antigravity_runs/<newRunId>/`.
- Écrire le pointeur: `data/tasks/T-003_ui-ux-review-ag/dev_result.json`.

