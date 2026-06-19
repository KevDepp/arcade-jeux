# T-001_web-game-core — Jeu web + logique de base

Assigned developer: `developer_codex`

## Objectif
Créer la base du jeu Puissance 4 jouable dans un navigateur (mode 2 joueurs), avec une UI propre et une logique robuste (détection victoire/égalité).

## Scope
- UI: grille, interactions (click colonne), indication du tour, reset.
- Logique: représentation plateau, application d’un coup, détection victoire, détection égalité.
- Mode: **2 joueurs local** (IA non requise dans cette tâche; intégrer les hooks pour T-002).

## Contraintes
- Vanilla HTML/CSS/JS, sans dépendances obligatoires.
- Séparer la logique du jeu de l’UI (fichiers JS distincts).

## Livrables
- Fichiers: `index.html`, `styles.css`, `src/*` (structure libre mais lisible).
- Logique de victoire complète (horizontal/vertical/diagonal).
- Reset/Rejouer.

## Definition of Done (preuves)
- Jeu jouable en 2 joueurs sur la page.
- Victoire et égalité détectées correctement.
- Aucun crash sur colonnes pleines / fin de partie.
- `data/tasks/T-001_web-game-core/dev_result.md` contient:
  - résumé + fichiers modifiés
  - commandes lancées (si applicable)
  - checklist manuelle rapide (au moins: lancer une partie, gagner, reset)
