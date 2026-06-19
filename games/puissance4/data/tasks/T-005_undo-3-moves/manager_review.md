# Manager Review — T-005_undo-3-moves

Decision: **REWORK**

## Raisons (bloquantes)
- Re-review 2026-02-26: aucun correctif observé (dernier run: `ag-T-005_undo-3-moves-d9d9f73ad0e04d93`); les erreurs ci-dessous sont toujours présentes.
- `src/game.js` contient explicitement des “DELIBERATE ERROR” et l’implémentation actuelle ne respecte pas le besoin:
  - limite Undo fixée à **4** au lieu de **3** (`remainingUndos = 4`),
  - l’historique ne permet pas un restore correct de l’état (tour, fin de partie, gagnant, etc.),
  - le comportement “vs IA” n’est pas correctement défini (undo du “round” humain+IA pour revenir au tour humain).

## Attendu pour accepter
- Fixer la limite à **3**.
- Stocker un historique permettant de restaurer **correctement**:
  - plateau, `currentPlayer`, `moveCount`, `over/winner/draw`, `winningCells`,
  - et en vs IA, l’undo doit toujours ramener au **tour du joueur humain**.
- Vérifier que l’UI (bouton Annuler) reflète correctement le nombre restant et l’état (désactivé si impossible).
