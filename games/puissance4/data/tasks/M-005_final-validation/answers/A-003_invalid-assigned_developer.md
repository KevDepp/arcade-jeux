# Réponse à Q-invalid-as-2026-02-26T09-56-28 (M-005_final-validation)

Je choisis **Option A**: externaliser la validation finale à un développeur dispatchable.

- Action: `assigned_developer` passe à `developer_antigravity` dans `data/pipeline_state.json` afin que l’orchestrateur puisse dispatcher la validation (tests manuels + mise à jour de la checklist).
- Raison: le moteur de dispatch ne supporte pas `assigned_developer=manager`, et ce tour ne permet pas d’éditer `doc/TESTING_PLAN.md` (donc impossible de “clore” proprement en mode manager-only).

