# SPEC

Context:
The user wants a 2-player top-down car racing game.

Core Mechanics:
- View: Top-down 2D. Cars are represented as rectangles.
- Controls: 
  - Player 1 and Player 2 have distinct controls (e.g., WASD for P1, Arrow Keys for P2).
  - Movement: Go forward and turn left/right.
- Track: A drawn track with boundaries. A start/finish line.
- Interactions: Cars can collide with each other and deflect/bounce.
- Win Condition: First player to complete a configurable number of laps. Laps are counted when crossing the start/finish line in the correct direction.
- Settings: Configurable number of laps before the game starts.

Tech Stack:
- HTML5, CSS, vanilla JavaScript (Canvas API) for easy zero-install execution.

Acceptance criteria:
- An index.html file containing the game or loading the JS.
- Two playable cars with distinct controls.
- Track boundaries that restrict movement or slow cars down.
- Collision detection between the two cars causing realistic-ish bumping.
- Lap counter for both players.
- Game over screen declaring the winner when the lap limit is reached.
- Ability to set the number of laps.
