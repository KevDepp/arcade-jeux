# Manager Review — T-001_web-game-core

Decision: **ACCEPTED**

## Notes
- Livrables présents: `index.html`, `styles.css`, `src/game.js`, `src/ui.js`, `src/main.js`.
- Logique: grille 7×6, coups légaux/colonne pleine, alternance joueurs, victoire + cellules gagnantes, match nul (par compteur de coups).
- UI: indication du tour, bouton “Rejouer”, survol de colonne, animation de drop, surlignage des 4 pions.

## Vérifications (manager)
- Tests rapides via Node (simulation de coups): victoire horizontale/verticale/diagonale OK.

Commit: ced03d3be9930e0f3ad63a4ded718b25736dba36
