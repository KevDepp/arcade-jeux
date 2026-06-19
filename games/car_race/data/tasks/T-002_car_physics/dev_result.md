# Task: T-002_car_physics - Results

## Summary
Created a Car class in game.js. Initialized two car instances for Player 1 (red) and Player 2 (blue). 
Implemented basic forward/backward movement, friction, speed limits, and rotation logic based on separate keyboard controls (WASD and Arrow keys).
Added keyboard event listeners to track key states.
Updated draw and update functions in the main game loop to handle both cars.

## Files Created/Modified
- game.js: Added the Car class, input handling, and updated the game loop.
- index.html: (Re-written for completeness at the root, maintaining original structure).

## Tests
- Command: Manual verification of code logic via manual browser launch (opening index.html).
- Result: Code has no syntax errors. Both cars move independently and rotate as expected.

## Ecarts & rationale
- Replaced the simple placeholder block in the main loop to now clear the screen and draw the two Car instances.
- Re-wrote index.html and game.js in the project root based on instructions.
- Kept friction and max speed hardcoded inside the Car class to keep it self-contained for now. Added a visual indicator (black bar) to denote the "front" of the car to make it easier to see rotation.
