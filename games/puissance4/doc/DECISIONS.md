# Decisions

- 2026-02-25: App 100% front-end (HTML/CSS/JS), aucune dépendance obligatoire (déploiement simple).
- 2026-02-25: IA facile = heuristique + hasard; IA difficile = recherche type minimax + alpha-beta + évaluation heuristique.
- 2026-02-25: Grille standard 7×6, victoire à 4 alignés; sur victoire, surlignage des 4 pions.
- 2026-02-25: Resync après édition utilisateur de `doc/TODO.md` (owners: Codex implémentation, AG revues).
- 2026-02-25: Nouvelle consigne utilisateur: implémentation des tâches de développement restantes via `developer_antigravity` (AG) ; `doc/TODO.md` normalisé en conséquence.
- 2026-02-25: T-003 watchdog (AG sans heartbeat/result). Décision: retry AG avec heartbeat strict (5 min) + signalisation `expected_silence_ms` en phase navigateur.
- 2026-02-26: Nouveau P0: fonctionnalité Undo (retour jusqu’à 3 coups). Création tâche `T-005_undo-3-moves` avant la validation finale.
- 2026-02-26: T-005 (Undo) — incohérences entre artefacts AG et état du code; exigence: relivrer un run AG propre + pointeur `dev_result.json` aligné avant acceptation.
- 2026-02-26: Guardrail "too many reviews" for T-005: advance pipeline to `M-005_final-validation` and validate Undo via manual checklist/tests to break the review loop.
