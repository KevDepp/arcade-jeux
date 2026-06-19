# Task: T-005_lap_logic_and_ui - Results

## Summary
Added an HTML/CSS UI layer over the canvas to handle the "Setup" (choose laps) and "Game Over" states.
Implemented lap counting logic inside the Car class with an anti-cheat checkpoint at the bottom of the track. Added on-canvas lap counters via ctx.fillText().

## Files Created/Modified
- index.html: Added a #ui-layer div with a setup screen and game-over screen.
- style.css: Styled the UI layer to center over the canvas, using pointer-events where necessary to ensure buttons are clickable.
- game.js: 
  - Added a gameState variable to pause the update loop until the start button is pressed.
  - Implemented startGame() and endGame() logic.
  - Implemented laps, hasPassedCheckpoint, and lastY on the Car class.
  - Checkpoint is triggered when passing checkpointY (bottom of track). Finish line is triggered when passing inishLineY (top of track) *while having passed the checkpoint*.
  - Rendered real-time lap progress on the top-left of the canvas.

## Tests
- Command: Manual playtesting.
- Result: The game starts paused behind the UI. Inputting a lap count and clicking start initiates the game. Driving around the track increments the lap count correctly. Reversing over the start line does nothing. Winning halts movement and displays the winner screen.

## Ecarts & rationale
- Moved the starting coordinates slightly back (startX - 50) so they don't immediately trigger the finish line on spawn/reset if they bump into each other.
- The finish line logic required checking the X coordinate implicitly to prevent triggering if they are just off-track wandering around the top/bottom left corners. Instead of pure X checks, I simplified it: to trigger the checkpoint/finish line, they must cross the Y threshold *while* x > canvas.width / 2 (i.e. on the right half of the track where the start line and curve down are). This ensures they have to go clockwise around the whole oval.
