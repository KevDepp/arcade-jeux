# Réponse Manager — guardrail “too many reviews” (2026-02-26)

Décision: **REWORK maintenu**, mais avec une action claire pour sortir de la boucle.

Constat:
- Les corrections Undo semblent présentes dans l’arbre de travail (limite à 3, suppression des “DELIBERATE ERROR”).
- Cependant, le dernier run référencé (`ag-T-005_undo-3-moves-d9d9f73ad0e04d93`) ne constitue pas une preuve fiable (résultat/trace non alignés avec les correctifs attendus).

Action demandée à `developer_antigravity`:
- Re-livrer **un nouveau run** (nouveau `data/antigravity_runs/<newRunId>/result.json`) décrivant les correctifs Undo.
- Mettre à jour `data/tasks/T-005_undo-3-moves/dev_result.json` pour pointer vers ce nouveau run.

Ensuite seulement: repasser en `ready_for_review`.

