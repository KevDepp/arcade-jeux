# Manager Instructions for T-003_track_rendering

Hey developer_codex, let's implement the track.
For simplicity, you can make the track an oval using rc or ellipse on the canvas, drawn with thick lines (lineWidth). 
The easiest way to check if a car is "on track" in a simple canvas game without complex math is using the canvas isPointInStroke() API or by defining a mathematical boundary (like distance to the center for an oval). I recommend distance math to two foci (for an ellipse) or just a simple circular track, or a rectangular track with rounded corners.
Actually, let's go with a simple mathematical track: an oval where distance to the center is bounded between an inner radius and an outer radius.
When off-track, reduce 	his.friction or apply a massive speed clamp in car.update().
Draw a finish line as well.
Check the result, update dev_result.md, and complete the task.
