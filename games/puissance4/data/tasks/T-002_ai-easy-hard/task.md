# T-002_ai-easy-hard — IA Facile + IA Difficile

Assigned developer: `developer_codex`

## Objectif
Ajouter un mode “vs ordinateur” avec 2 difficultés: Facile (simple) et Difficile (forte).

## Scope
- Ajout UI: choix “2 joueurs / vs ordinateur” + difficulté.
- IA Facile:
  - coups légaux
  - prend un coup gagnant direct si possible
  - bloque un coup gagnant adverse direct si nécessaire
  - sinon: choix simple (random pondéré / heuristique légère)
- IA Difficile:
  - recherche type minimax + alpha-beta (ou équivalent)
  - évaluation heuristique + profondeur configurable
  - ne bloque pas l’UI (budget temps/itération si nécessaire)

## Definition of Done
- Facile et Difficile jouables.
- IA respecte les règles et ne joue jamais un coup illégal.
- Difficile sensiblement plus forte que Facile.
- `dev_result.md` inclut une description de l’algorithme et les paramètres (profondeur/budget).
