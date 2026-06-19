# T-005_undo-3-moves — Undo (3 coups)

Assigned developer: `developer_antigravity`

## Objectif
Ajouter une fonctionnalité permettant au joueur humain d’**annuler** des coups récents:
- possibilité de revenir en arrière,
- **limité à 3** annulations.

## Scope
- Ajouter un bouton UI (ex: “Annuler” / “Retour”).
- Conserver un historique des coups pour pouvoir revenir en arrière.
- Comportement attendu:
  - en **2 joueurs (pvp)**: annule **le dernier coup** (1 pion), jusqu’à 3 fois.
  - en **vs IA**: l’annulation doit ramener au **tour du joueur humain** (ex: annuler le dernier “round” humain+IA si nécessaire), jusqu’à 3 fois.
- États fin de partie:
  - après undo, rétablir correctement `over/winner/draw` et le surlignage éventuel.
- UX:
  - bouton désactivé si aucun undo restant ou historique insuffisant.

## Definition of Done
- Undo fonctionne en pvp et vs IA selon la règle ci-dessus.
- Limite 3 undos respectée.
- Aucun crash/état incohérent (tour courant, plateau, victoire/égalité).
- `data/tasks/T-005_undo-3-moves/dev_result.json` (AG) décrit l’implémentation + comment tester rapidement.

