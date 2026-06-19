# TODO
Contraintes:

Toutes les tâches de developpement restantes doivent être faite avec AG (`developer_antigravity`)

Règles:
- `P0` = requis pour répondre à la demande utilisateur.
- `P1/P2` = améliorations optionnelles.
- Ordre d’exécution explicite: (1), (2), (3)…

## P0 — Exécution
- [x] P0 (1) (developer_codex) Implémenter le jeu web (UI + logique Puissance 4) (proof: `index.html`, `styles.css`, `src/*`, démo manuelle)
- [x] P0 (2) (developer_antigravity) Implémenter IA Facile + IA Difficile et intégration UI (proof: `src/ai*`, options difficulté, tests manuels)
- [x] P0 (3) (developer_antigravity) Revue UX/UI dans navigateur + corrections CSS/ergonomie (proof: `data/antigravity_runs/...`, patch CSS/HTML, notes)
- [x] P0 (4) (developer_antigravity) Revue documentation SPEC/TODO/TESTING_PLAN cohérence (proof: `data/antigravity_runs/...`, corrections doc si besoin)

- [x] P0 (5) (developer_antigravity) Undo: permettre au joueur humain de revenir en arrière (max 3). (task: `T-005_undo-3-moves`) (proof: bouton Annuler + tests manuels)
- [x] P0 (6) (developer_antigravity) Validation (tests manuels) + mise à jour `doc/TESTING_PLAN.md` (task: `M-005_final-validation`) (proof: checklist + notes)
- [x] P0 (7) (developer_antigravity) Fix IA: en mode vs IA, l'IA doit jouer (Facile + Difficile) + contraste select. (task: `T-006_fix_ai_not_playing`) (proof: checklist IA cochée)

## P1 — Nice to have
- [ ] P1 (developer_antigravity) Animation de chute plus fluide + micro-interactions (hover colonne, glow)
- [ ] P1 (developer_antigravity) Accessibilité: navigation clavier + labels ARIA basiques
- [ ] P1 (developer_antigravity) Option “changer qui commence” (J1/J2/IA)

## P2 — Bonus
- [ ] P2 (developer_antigravity) Mode “timed” (tour limité) ou stats locales (facultatif)
