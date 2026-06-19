# Résultat Implémentation IA - T-002_ai-easy-hard

## Description de l'algorithme

### IA Facile (`ai-easy`)
- **Vérification de victoire immédiate** : L'IA simule chaque colonne valide et joue le coup s'il la fait gagner directement.
- **Blocage immédiat** : L'IA simule le jeu de l'adversaire sur chaque colonne valide et bloque s'il allait gagner au prochain coup.
- **Coup aléatoire** : Si aucune des deux conditions n'est remplie, l'IA choisit une colonne valide au hasard.

### IA Difficile (`ai-hard`)
- **Recherche Minimax avec Alpha-Beta Pruning** : L'IA simule l'arbre des coups possibles à l'avance pour maximiser son score et minimiser celui de l'adversaire. La profondeur maximale (`MAX_DEPTH`) est fixée à 6, ce qui permet à l'algorithme de tourner très rapidement en JavaScript natif sans bloquer l'interface (~5 à 100 ms typiquement).
- **Heuristique d'évaluation spatiale** :
  - **Avantage du centre** : L'IA reçoit un bonus pour le contrôle de la colonne centrale.
  - **Reconnaissances de fenêtres** : L'évaluation scrute des fenêtres de 4 pions. Un groupe de 3 pions alliés avec une case libre vaut plus que 2 pions alliés, et un blocage d'un groupe ennemi de 3 pions rapporte un très gros bonus.
- **Optimisation** : Pour les tout premiers tours, l'IA joue au centre directement afin d'économiser l'arbre de recherche. Le tri des coups par proximité du centre accélère la coupe Alpha-Beta en testant d'abord les coups statistiquement meilleurs.

L'interface de la page web a été adaptée pour contenir un menu déroulant permettant de choisir entre :
- 2 joueurs
- vs IA Facile
- vs IA Difficile

Le système gère l'attente avec un petit `setTimeout` (400ms) pour ne pas perturber l'expérience utilisateur et permettre l'animation du pion. Le reset du jeu et le changement de mode fonctionnent sans glitch.
