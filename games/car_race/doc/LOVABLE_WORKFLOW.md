# Lovable Workflow

Ce document definit la choregraphie obligatoire entre le **Manager**, le **Developer Codex** et **Antigravity (AG)** pour l'utilisation de Lovable dans Antidex.

Important:
- Lovable ne peut pas importer un depot GitHub existant rempli de code.
- Lovable doit etre l'initiateur du projet GitHub qu'il synchronise.
- Si `useLovable` est active, les agents doivent suivre ce document plutot qu'inventer un flux ad hoc.

## Cas 1: Nouveau Projet

Utiliser ce workflow si le projet cible est vide ou si l'on veut laisser Lovable initialiser la base UI.

1. Le Manager assigne a AG la creation du projet dans Lovable.
2. AG cree le projet dans Lovable.
3. AG clique sur "Connect to GitHub" depuis Lovable.
4. Lovable cree un nouveau repo GitHub et y pousse son code initial.
5. AG retourne au Manager l'URL du repo, la visibilite et une preuve visuelle.
6. Le Manager demande ensuite a Developer Codex de cloner ce repo dans le `cwd` local et de poursuivre le travail normal.

## Cas 2: Projet Existant

Utiliser ce workflow si le projet contient deja du code que l'on veut conserver, tout en utilisant Lovable pour une refonte cosmetique ou ergonomique.

1. Le Manager assigne a AG la creation d'un projet Lovable vierge relie a un **nouveau** repo GitHub.
2. AG cree le projet vierge dans Lovable et le connecte a GitHub.
3. AG retourne au Manager l'URL du repo intermediaire, la visibilite et une preuve visuelle.
4. Le Manager demande a Developer Codex de:
   - cloner ce nouveau repo Lovable dans un dossier temporaire ou de travail,
   - copier l'integralite du code du projet existant dans ce clone, sauf `.git`,
   - commit et push vers la branche par defaut du repo Lovable.
5. Le Manager renvoie ensuite AG dans Lovable pour verifier que les fichiers sont bien visibles.
6. AG envoie un framing prompt strict a Lovable:

```text
Ce projet est une appli React/Vite existante. Analyse d'abord la structure actuelle avant de modifier quoi que ce soit. Preserve l'architecture, les routes, et les integrations existantes. Ameliore uniquement le cosmetique ou l'ergonomie du projet.
```

7. Une fois les modifications Lovable produites, Developer Codex recupere les changements via Git.

## Preuves attendues

Quand AG utilise Lovable, `result.json` doit inclure au minimum:
- `repo_url_https`
- `repo_url_ssh` si disponible
- `visibility`
- `lovable_project_name` si disponible
- `workflow_case`: `new_project` ou `existing_project`
- `artifacts`: au moins une capture pertinente

## Garde-fous

- Ne jamais supposer qu'un repo GitHub existant peut etre "importe" dans Lovable.
- Pour un projet existant, ne jamais laisser Lovable reecrire l'architecture sans prompt de cadrage strict.
- Si la synchronisation GitHub -> Lovable ne montre pas encore les fichiers, AG doit le signaler explicitement comme blocage au lieu de continuer a l'aveugle.
