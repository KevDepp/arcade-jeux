# Task: T-005_lap_logic_and_ui

## Description
Implement a lap counter system, a way to configure the number of laps before the game starts, and a "Game Over" win screen.

## Acceptance Criteria
- A simple HTML overlay or prompt to ask "How many laps?" (or just an input field + "Start" button) that initializes the game.
- Each car has a lapCount property.
- When a car crosses the finish line *in the correct direction*, increment lapCount.
- Ensure cars cannot just reverse over the finish line back and forth to cheat.
- Display each player's current lap on the screen (e.g. using ctx.fillText).
- When a car reaches the configured lap count, halt the game and declare that player the winner.
