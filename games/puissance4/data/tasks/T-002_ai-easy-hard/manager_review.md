# Manager Review — T-002_ai-easy-hard

Decision: **ACCEPTED**

## Résumé
- Mode de jeu ajouté: `pvp`, `vs IA Facile`, `vs IA Difficile` (sélecteur dans `index.html`).
- IA:
  - Facile: win immédiat / block immédiat / sinon aléatoire.
  - Difficile: minimax + alpha-beta, profondeur `MAX_DEPTH = 6` + heuristique (centre + fenêtres).
- Intégration UI: l’IA joue automatiquement en **Joueur 2** avec un léger délai (UX), reset + changement de mode reset la partie.

## Vérifications (manager)
- Tests rapides via Node: `getEasyMove` win/block OK; `getHardMove` retourne un coup légal.

## Références AG
- Run: `ag-T-002_ai-easy-hard-c8c36a9effd947a7` (voir `data/antigravity_runs/ag-T-002_ai-easy-hard-c8c36a9effd947a7/result.json`)
- Pointeur: `data/tasks/T-002_ai-easy-hard/dev_result.json`

Commit: 2cf7a7af7e07e768602cc3a60cfa52588223ab3d
