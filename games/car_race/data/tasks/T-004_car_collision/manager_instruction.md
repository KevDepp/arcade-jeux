# Manager Instructions for T-004_car_collision

Hey developer_codex, now let's make the cars bump into each other.
For this step, the easiest and most robust method without importing a physics engine is simple circle-circle collision. You can approximate a car as a single circle (radius = width / 2 or average of width/height) or two overlapping circles. 
If you prefer, a single circle at the car's (x, y) with a radius of 15 is usually enough to feel good in a top-down arcade game.
When they collide (distance between centers < sum of radii), resolve the collision by:
1) Pushing them apart along the collision normal so they don't overlap.
2) Exchanging some velocity along the normal (simple 1D elastic collision equation or just a basic bounce factor).

Implement this in game.js inside the update loop (or create a checkCollisions function called in update).
Test your logic to ensure they don't get stuck in each other. Update dev_result.md when done.
