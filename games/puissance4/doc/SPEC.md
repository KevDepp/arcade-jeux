# SPEC — Puissance 4 (web)

## 1) Contexte
L’utilisateur demande un jeu de **Puissance 4** jouable sur une **page web**, en:
- **2 joueurs** (local “hotseat”),
- **contre l’ordinateur** avec **2 niveaux** de difficulté (**facile** et **difficile**).
L’interface doit être **plutôt jolie**.

## 2) Objectifs
- Fournir une **single-page app** (HTML/CSS/JS) qui fonctionne dans un navigateur moderne.
- Permettre de jouer:
  - Joueur vs Joueur (alternance des tours),
  - Joueur vs IA (IA joue automatiquement à son tour).
- IA:
  - **Facile**: joue correctement (coups légaux, partie finissable), mais pas optimisée.
  - **Difficile**: doit être **forte** (bloque, cherche la victoire, minimise les erreurs évidentes).
- UI agréable, lisible, responsive.

## 3) Non-objectifs (pour éviter le scope creep)
- Pas de backend, pas de comptes, pas de stockage en ligne.
- Pas de multijoueur réseau.
- Pas d’éditeur de niveaux / variantes.

## 4) Règles du jeu
- Grille standard: **7 colonnes × 6 lignes**.
- Un coup = déposer un pion dans une colonne; il tombe sur la case libre la plus basse.
- Victoire = **4 pions alignés** (horizontal, vertical, diagonal).
- Si la grille est pleine sans alignement: match nul.

## 5) Exigences fonctionnelles (UI/UX)
- Choix du mode: **2 joueurs** / **vs ordinateur**.
- Si vs ordinateur: choix difficulté **Facile / Difficile**.
- Boutons: **Rejouer / Reset** (au minimum).
- Indication claire:
  - joueur courant (et couleur),
  - état fin de partie (victoire/égalité),
  - colonne survolée/cliquable.
- Feedback visuel:
  - animation “drop” ou équivalent,
  - sur victoire: surligner les 4 pions gagnants.
- Responsive: jouable desktop + mobile.

## 6) Exigences IA (contrat)
- IA ne joue **que des coups légaux**.
- L’IA doit détecter immédiatement:
  - coup gagnant direct,
  - blocage d’un coup gagnant adverse direct.
- **Facile**: heuristique simple + part de hasard acceptable.
- **Difficile**: recherche (ex: minimax + alpha-beta) avec évaluation heuristique; doit être “dure à battre”.
- Performance: le tour IA ne doit pas geler l’UI (viser < ~500 ms sur machine standard; ajustable via profondeur/itération).

## 7) Contraintes techniques
- Déploiement simple: ouvrir `index.html` (ou via un petit serveur statique local) doit suffire.
- Pas de dépendances obligatoires (vanilla JS privilégié).
- Code lisible, découpé (logique de jeu séparée de l’UI).

## 8) Livrables attendus
- Une page web complète (au minimum): `index.html`, `styles.css`, JS (dans `src/` ou fichier unique).
- Documentation mise à jour: `doc/TODO.md`, `doc/TESTING_PLAN.md`, `doc/DECISIONS.md` si nécessaire.

## 9) Critères d’acceptation
- Ouvrir l’app (navigateur) permet de lancer une partie **JvJ** et une partie **vs IA**.
- La détection de victoire fonctionne pour les 3 directions + l’égalité.
- Mode **facile**: l’IA joue sans bug et termine une partie.
- Mode **difficile**: l’IA prend des décisions nettement meilleures (bloque/attaque correctement).
- UI “plutôt jolie”, utilisable sur mobile et desktop.
