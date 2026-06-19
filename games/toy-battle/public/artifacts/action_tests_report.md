# Action-Based Test Verification Report

This report summarizes the verification of every user action and visual rendering rules (character images and player color outlines) in **Toy Battle**.

## Verification Results

| Test Action / Visual Rule | Status | Detail |
| --- | --- | --- |
| Initial Game Load | ✅ PASS | Title: Toy Battle |
| Action: Change Terrain | ✅ PASS | Terrain: Le cimetiere maudit - human vs AI |
| Action: Start Tutorial | ✅ PASS | Progress: 1/15 |
| Action: Explain Invalid Placement | ✅ PASS | Feedback: La dalle bord gauche reste interdite: une pose doit etre connectee au Q.G. par vos propres bases; les bases vides ou rouges coupent la chaine. |
| Action: Exit Tutorial | ✅ PASS | Tutorial closed successfully |
| Action: Reset Game | ✅ PASS | Board is cleared of all troops |
| Action: Draw Card | ✅ PASS | Blue cards drawn: 5 |
| Action: Select Troop | ✅ PASS | Legal target bases: p_top_left_square, p_top_center_square |
| Action: Hover Node | ✅ PASS | Hovered node p_top_left_square |
| Action: Place Troop | ✅ PASS | Node p_top_left_square occupied by blue: kwak |
| Visual: Character Image Class | ✅ PASS | Classes: compact-troop owner-blue type-kwak theme-duck |
| Visual: Player Color Outline | ✅ PASS | Base classes: node is-compact is-plaza    occupied-blue    |
| Full Game Simulation | ✅ PASS | Simulated 20 turns. Game over: true. Scores: Joueur Bleu
★
★
★
★
★
★
★
0 / 7 (reste 7), Joueur Rouge
★
★
★
★
★
★
★
5 / 7 (reste 2) |

## Visual Verification Artifacts

Below are the screenshots captured at key stages of user actions:

- **Initial State**: ![Initial State](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_01_initial.png)
- **Terrain Changed (Cemetery)**: ![Cemetery Terrain](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_02_terrain_changed.png)
- **Tutorial Started**: ![Tutorial Started](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_03_tutorial_started.png)
- **Invalid Placement Explained**: ![Invalid Explained](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_04_invalid_explained.png)
- **Tutorial Exited**: ![Tutorial Exited](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_05_tutorial_exited.png)
- **Game Reset**: ![Reset](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_06_reset.png)
- **Card Drawn**: ![Draw Card](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_07_draw.png)
- **Card Selected**: ![Card Selected](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_08_selected.png)
- **Node Hovered**: ![Node Hovered](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_09_hover.png)
- **Troop Placed**: ![Troop Placed](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_10_placed.png)
- **Simulation End State**: ![Simulation End](file:///C:/Users/kdeplus/OneDrive - Université Libre de Bruxelles/Bureau/code/Games/toy-battle/public/artifacts/action_11_simulation_end.png)

