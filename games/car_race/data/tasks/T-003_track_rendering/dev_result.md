# Task: T-003_track_rendering - Results

## Summary
Rendered a simple mathematical oval track using ctx.ellipse. Added inner and outer boundaries, plus a checkered finish line.
Implemented an isOffTrack(x, y) function that computes the distance from the car's center to the mathematical boundary of the ellipse. 
Cars are penalized (speed capped, acceleration halved, friction increased) if they stray onto the green background (grass/gravel).

## Files Created/Modified
- game.js: Added drawTrack with the finish line and boundaries. Rewrote Car.update() to hook into isOffTrack and apply slowdown penalties. Re-positioned cars to start at the finish line, pointing right.

## Tests
- Command: Manual verification of code logic via manual browser launch.
- Result: Code runs smoothly. When driving onto the green background, cars visibly slow down. Drawing the finish line correctly renders a checkered box.

## Ecarts & rationale
- The mathematical off-track check is simple and fast, avoiding pixel-perfect collision maps. Since an ellipse's width is variable across angles when drawn with lineWidth, we approximate the actual radius bounds by resolving the ellipse distance formula for the angle the car sits at from the center. This is "good enough" for an arcade feel.
- I slightly modified the Car variables to aseMaxSpeed, aseAcceleration, and aseFriction so it was easier to toggle the stats between off-track and on-track states without losing the original numbers.
