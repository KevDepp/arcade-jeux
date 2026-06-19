# Task: T-004_car_collision - Results

## Summary
Implemented basic circle-circle collision logic between Player 1 and Player 2 cars.

## Files Created/Modified
- game.js: 
  - Added a adius property to the Car class.
  - Added a esolveCollision(carA, carB) function that detects if the distance between cars is less than their combined radii.
  - When colliding, cars are physically separated along the collision normal so they don't clip inside each other.
  - Applied a simple scalar speed penalty and momentum transfer to simulate a "bump" in a top-down scalar-velocity arcade context.
  - Hooked esolveCollision into the main update loop.

## Tests
- Command: Manual playtesting.
- Result: When driving a car into the other (stationary or moving), they deflect each other and transfer speed correctly without overlapping/getting stuck.

## Ecarts & rationale
- I chose circle-circle collision instead of OBB (Oriented Bounding Box) because it handles the rotation smoothly without complex SAT (Separating Axis Theorem) math. A radius of 15 effectively bounds the 20x40 rectangle without massive corner clipping.
- Because cars are driven by a single scalar speed parameter based on their forward angle (rather than a 2D velocity vector x/y), true elastic 2D momentum transfer cannot be perfectly mapped back to just "speed forward". The simplified approach reduces their speed slightly and translates their (x, y) coordinates forcibly along the collision normal. This achieves the visual and mechanical requirement of bumping.
