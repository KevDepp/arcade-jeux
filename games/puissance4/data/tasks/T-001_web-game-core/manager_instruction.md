# Instructions Manager — T-001_web-game-core

Lis d’abord:
- `agents/developer_codex.md` (version en tête de fichier)
- `doc/DOCS_RULES.md`, puis `doc/INDEX.md`
- `doc/SPEC.md`, `doc/TODO.md`, `doc/TESTING_PLAN.md`, `doc/DECISIONS.md`

## Implémentation demandée (sans IA pour l’instant)
- Créer une web app statique Puissance 4:
  - grille 7×6
  - click sur colonne -> pion tombe (animation simple ok)
  - tour alterné J1/J2
  - victoire/égalité + surlignage des 4 pions gagnants
  - bouton Reset/Rejouer
- Prévoir l’intégration future “vs IA” (structure JS propre), mais ne pas implémenter l’IA ici.

## Structure recommandée (flexible)
- `index.html`
- `styles.css`
- `src/game.js` (modèle + règles)
- `src/ui.js` (render + events)
- `src/main.js` (bootstrap)

## Sorties attendues (obligatoire)
1) ACK rapide: `data/tasks/T-001_web-game-core/dev_ack.json`
2) RESULT: `data/tasks/T-001_web-game-core/dev_result.md`
3) Mettre `developer_status=ready_for_review` dans `data/pipeline_state.json` en fin de tâche.
