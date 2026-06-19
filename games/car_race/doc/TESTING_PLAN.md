# TESTING_PLAN

Objective: Verify that the 2-player racing game functions as specified.

Tests:
1. Verify index.html loads without console errors.
2. Verify both players can control their cars independently (WASD vs Arrow keys).
3. Verify the lap setting works (e.g., set to 3 laps).
4. Verify cars interact correctly with the track bounds (can't cheat by cutting entirely, or slowed down off-track).
5. Verify car-to-car collision pushes/deflects appropriately.
6. Verify lap increment logic works properly (can't increment by moving back and forth over the line).
7. Verify the game stops and declares a winner when a player hits the target lap count.

Strategy:
- Manual playtesting in browser.
