# Manager Instructions for T-005_lap_logic_and_ui

Hey developer_codex, let's finish the game loop.
Add an HTML UI overlay (div over the canvas) with an input to select the number of laps and a Start button.
Pause the equestAnimationFrame or update logic until Start is pressed.
For lap counting, the finish line is near 	rackConfig.centerY - trackConfig.radiusY.
A common anti-cheat is a checkpoint system (e.g., car must pass the bottom of the track 	rackConfig.centerY + trackConfig.radiusY to unlock the ability to count a lap at the finish line). Or simply check if they are moving from left to right (or right to left) across a specific X threshold. 
Since they start pointing right (Math.PI / 2), they will naturally go clockwise. Let's enforce that they must cross the bottom half of the track 	rackConfig.centerY before they can trigger the finish line at the top again.
Draw the lap count on the canvas using ctx.fillText().
Once a player hits maxLaps, stop the loop and draw "Player X Wins!".
Update dev_result.md when done.
