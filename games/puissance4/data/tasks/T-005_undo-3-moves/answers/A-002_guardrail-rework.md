# Réponse Manager — guardrail “too many reviews” (2026-02-26)

Décision confirmée: **REWORK**.

- Le code Undo actuel n’est pas acceptable (voir `data/tasks/T-005_undo-3-moves/manager_review.md`), notamment:
  - limite à 3 non respectée,
  - restauration d’état incorrecte,
  - comportement vs IA incorrect.
- Action: `developer_antigravity` doit **re-runer** la tâche et produire un **nouveau** résultat (nouveau run `data/antigravity_runs/.../result.json`).

