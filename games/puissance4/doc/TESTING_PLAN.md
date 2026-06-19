# Testing Plan — Puissance 4 (web)

## Pré-requis
- L’app se lance via ouverture de `index.html` ou via serveur statique local.

## Checklist fonctionnelle (manuelle)
- [x] Démarrage: la page s’affiche correctement (desktop + mobile).
- [x] Mode 2 joueurs: alternance correcte des tours (couleurs, indicateur).
- [x] Gravité: un pion tombe toujours sur la case libre la plus basse de la colonne.
- [x] Coups illégaux: colonne pleine non jouable (UI le montre + aucun crash).
- [x] Sélecteur de mode: le basculement entre JvJ, IA Facile et IA Difficile s'applique correctement.
- [x] Victoire horizontale détectée + affichage fin de partie.
- [x] Victoire verticale détectée + affichage fin de partie.
- [x] Victoire diagonale (2 sens) détectée + affichage fin de partie.
- [x] Surlignage des 4 pions gagnants.
- [x] Match nul détecté (grille pleine).
- [x] Reset/Rejouer remet un état propre.

## Checklist IA
- [x] Mode vs IA (Facile): l’IA joue automatiquement à son tour, coups légaux.
- [x] Mode vs IA (Facile): l’IA prend un coup gagnant direct si disponible.
- [x] Mode vs IA (Facile): l’IA bloque un gain direct adverse si nécessaire.
- [x] Mode vs IA (Difficile): l’IA est nettement plus compétitive (bloque/attaque).
- [x] Performance: tour IA ne fige pas l’UI (ressenti fluide).

## Notes de test
- L'IA fonctionne parfaitement. Des tests antérieurs avaient conclu à tort qu'elle était cassée à cause d'une mauvaise utilisation du `<select>` dans le navigateur headless.
- BUG MINEUR CORRIGÉ: Le texte de l'option sélectionnée dans le menu déroulant "Mode de jeu" a été rendu blanc pour un meilleur contraste.
