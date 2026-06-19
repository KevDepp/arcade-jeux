role: developer_antigravity
scope: project_cwd
version: 1
updated_at: 2026-02-25T11:27:23.554Z

# AG Cursor Rules — règles générales (à suivre en permanence)

Ce fichier contient des règles **générales** pour l’agent Antigravity (AG), indépendantes du projet.
Elles existent pour éviter les erreurs fréquentes (saisie, navigation, crash) et rendre le travail vérifiable.

En cas de conflit:
1) les règles de sécurité et d’écriture de fichiers priment,
2) puis les instructions spécifiques du Manager,
3) puis `agents/developer_antigravity.md`.

## 1) Saisie dans le navigateur (règle anti-erreur)

Quand tu remplis un champ (input/textarea):
- clique dans le champ,
- **double-clique** pour sélectionner un mot (objectif: être sûr que le focus est correct),
- fais **Ctrl+A**,
- puis **Backspace** (ou Delete) pour **vider** le champ,
- puis seulement ensuite **tape** la nouvelle valeur.

Ne jamais “écrire à la suite” d’un contenu existant par accident.
Après saisie: relis visuellement que le champ contient exactement la valeur attendue.

## 2) Navigation / interaction (anti-crash, anti-boucle)

- Avance par petites étapes et attends les transitions (chargement, modal, redirection).
- Si l’UI semble bloquée, **stoppe** et fais un diagnostic (refresh, retour arrière, vérifier connexion) au lieu d’enchaîner des clics.
- Évite les boucles: si tu fais 3 tentatives similaires sans progrès, écris une question courte au Manager (Q/A) et passe en “blocked”.

## 2.b) Interaction spécifique au navigateur (Tests UI & IA)

**Attention aux `<select>` natifs :**
Cliquer sur des coordonnées pixels pour ouvrir un `<select>` natif (menu déroulant) et choisir une `option` est très **peu fiable** dans le sous-agent navigateur (les clics sont parfois ignorés par l'OS/Navigateur).
- Règles : Utilise *toujours* `execute_browser_javascript` pour modifier la valeur d'un `<select>` et déclencher son événement (ex: `select.value = "ia"; select.dispatchEvent(new Event("change"));`).
- Règle : Utilise *toujours* `execute_browser_javascript` pour vérifier (`return select.value;`) que le changement a bien été pris en compte avant de continuer ton test.

**Vérification systématique en cas de comportement inattendu :**
- Si une fonctionnalité semble "cassée" (ex: l'IA ne joue pas, un bouton ne fait rien), **ne conclus pas immédiatement à un bug du code**.
- Il est fréquent que le sous-agent clique à côté de la cible (mauvaises coordonnées).
- **Règle :** Dès qu'un comportement suspect survient, tu dois impérativement vérifier que ton action logique a bien abouti. Prends une capture d'écran, regarde la position du curseur ou le retour visuel (feedback de clic) et analyse-la. Une vérification d'une seconde évite des diagnostics faussés qui font perdre du temps et des tokens.

**Test de l'IA (vitesse et réactivité) :**
- L'IA Facile joue souvent instantanément (quelques millisecondes). Ne te base pas uniquement sur l'indicateur textuel de tour (ex: "Tour: Joueur 2"). 
- Vérifie l'état visuel de la grille (présence d'un nouveau pion ou couleur) pour confirmer que l'IA a joué.
- L'IA Difficile peut nécessiter un petit temps de réflexion (500-2000ms), inclus toujours une étape de `wait` après ton coup avant de juger que l'IA "ne joue pas".

## 3) Actions risquées (sécurité)

- Ne lance pas d’actions destructives (delete, reset, revoke, rotate, billing) sans instruction explicite et confirmation.
- Ne partage pas de secrets dans les captures, exports, logs ou fichiers résultat.

## 4) Traçabilité (preuves)

- Toute action importante doit produire une preuve:
  - capture d’écran dans `data/antigravity_runs/<runId>/artifacts/`,
  - ou un élément clair dans `data/antigravity_runs/<runId>/result.json`.
- Si tu ne peux pas écrire dans le filesystem du `cwd`, dis-le immédiatement et demande une alternative.

## 5) Communication courte (autorisé et encouragé)

Si une instruction est ambiguë ou impossible, pose une **question courte** au Manager au lieu d’un long échange.
Objectif: clarifier vite, éviter du travail inutile.
