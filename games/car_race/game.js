const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const setupScreen = document.getElementById('setup-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const lapInput = document.getElementById('lap-input');
const winnerText = document.getElementById('winner-text');

let lastTime = 0;
let gameState = 'SETUP'; // 'SETUP', 'PLAYING', 'GAMEOVER'
let maxLaps = 3;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Track properties (Ellipse)
const trackConfig = {
    centerX: canvas.width / 2,
    centerY: canvas.height / 2,
    radiusX: 300,
    radiusY: 200,
    thickness: 100
};

// Finish line Y coordinate (top of the track)
const finishLineY = trackConfig.centerY - trackConfig.radiusY;
// Checkpoint Y coordinate (bottom of the track)
const checkpointY = trackConfig.centerY + trackConfig.radiusY;

function isOffTrack(x, y) {
    const dx = x - trackConfig.centerX;
    const dy = y - trackConfig.centerY;
    
    const angle = Math.atan2(dy, dx);
    const ellipseDistAtAngle = Math.sqrt(
        1 / (Math.pow(Math.cos(angle) / trackConfig.radiusX, 2) + Math.pow(Math.sin(angle) / trackConfig.radiusY, 2))
    );
    
    const actualDist = Math.sqrt(dx*dx + dy*dy);
    
    const trackInner = ellipseDistAtAngle - (trackConfig.thickness / 2);
    const trackOuter = ellipseDistAtAngle + (trackConfig.thickness / 2);
    
    return actualDist < trackInner || actualDist > trackOuter;
}

class Car {
    constructor(x, y, color, controls, name) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 40;
        this.radius = 15;
        this.color = color;
        this.name = name;
        this.angle = Math.PI / 2;
        this.speed = 0;
        this.baseMaxSpeed = 5;
        this.baseAcceleration = 0.2;
        this.baseFriction = 0.05;
        this.baseRotationSpeed = 0.05;
        
        this.maxSpeed = this.baseMaxSpeed;
        this.acceleration = this.baseAcceleration;
        this.friction = this.baseFriction;
        this.rotationSpeed = this.baseRotationSpeed;

        this.controls = controls;

        // Lap logic
        this.laps = 0;
        this.hasPassedCheckpoint = false;
        this.lastY = y;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.angle = Math.PI / 2;
        this.speed = 0;
        this.laps = 0;
        this.hasPassedCheckpoint = false;
        this.lastY = this.startY;
    }

    update() {
        // Track bounds check
        const offTrack = isOffTrack(this.x, this.y);
        if (offTrack) {
            this.maxSpeed = this.baseMaxSpeed * 0.4;
            this.friction = this.baseFriction * 3;
            this.acceleration = this.baseAcceleration * 0.5;
        } else {
            this.maxSpeed = this.baseMaxSpeed;
            this.friction = this.baseFriction;
            this.acceleration = this.baseAcceleration;
        }

        // Rotation
        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (keys[this.controls.left]) {
                this.angle -= this.rotationSpeed * flip;
            }
            if (keys[this.controls.right]) {
                this.angle += this.rotationSpeed * flip;
            }
        }

        // Acceleration
        if (keys[this.controls.forward]) {
            this.speed += this.acceleration;
        } else if (keys[this.controls.backward]) {
            this.speed -= this.acceleration;
        }

        // Friction
        if (this.speed > 0) {
            this.speed -= this.friction;
            if (this.speed < 0) this.speed = 0;
        } else if (this.speed < 0) {
            this.speed += this.friction;
            if (this.speed > 0) this.speed = 0;
        }

        // Cap speed
        if (Math.abs(this.speed) > this.maxSpeed) {
            this.speed -= Math.sign(this.speed) * this.friction;
        }

        // Move
        const nextY = this.y - Math.cos(this.angle) * this.speed;
        this.x += Math.sin(this.angle) * this.speed;
        this.y = nextY;
        
        // Screen Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width) this.x = canvas.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height) this.y = canvas.height;

        // Lap Logic Check
        // Going downwards past the checkpoint (bottom of track)
        if (this.y >= checkpointY && this.lastY < checkpointY && this.x > canvas.width / 2) {
             // Basic anti-cheat: must be on right side going down, or just rely on the Y crossing
             this.hasPassedCheckpoint = true;
        }
        
        // Going upwards past the finish line (top of track)
        if (this.y <= finishLineY && this.lastY > finishLineY && this.hasPassedCheckpoint && this.x > canvas.width / 2) {
            this.laps++;
            this.hasPassedCheckpoint = false; // Reset for next lap
            
            if (this.laps >= maxLaps) {
                endGame(this.name);
            }
        }

        this.lastY = this.y;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Front indicator
        ctx.fillStyle = '#000000';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 5);

        ctx.restore();
    }
}

const startX = trackConfig.centerX + trackConfig.radiusX - (trackConfig.thickness / 2); // Put them on the right side straightaway
// Wait, finish line is at the top. Let's start them just BEFORE the finish line pointing right.
const startX_corrected = trackConfig.centerX - 50;
const startY_corrected = trackConfig.centerY - trackConfig.radiusY;

const player1 = new Car(startX_corrected, startY_corrected - 20, 'red', {
    forward: 'w',
    backward: 's',
    left: 'a',
    right: 'd'
}, 'Player 1 (Red)');

const player2 = new Car(startX_corrected, startY_corrected + 20, 'blue', {
    forward: 'ArrowUp',
    backward: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight'
}, 'Player 2 (Blue)');

function resolveCollision(carA, carB) {
    const dx = carB.x - carA.x;
    const dy = carB.y - carA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = carA.radius + carB.radius;

    if (distance < minDist) {
        const overlap = minDist - distance;
        if (distance === 0) return;
        
        const nx = dx / distance;
        const ny = dy / distance;

        carA.x -= nx * (overlap / 2);
        carA.y -= ny * (overlap / 2);
        carB.x += nx * (overlap / 2);
        carB.y += ny * (overlap / 2);

        const vxA = Math.sin(carA.angle) * carA.speed;
        const vyA = -Math.cos(carA.angle) * carA.speed;
        const vxB = Math.sin(carB.angle) * carB.speed;
        const vyB = -Math.cos(carB.angle) * carB.speed;

        const rvx = vxB - vxA;
        const rvy = vyB - vyA;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal > 0) return;

        carA.speed *= 0.8;
        carB.speed *= 0.8;
        
        const transfer = velAlongNormal * 0.5;
        carA.speed += transfer;
        carB.speed -= transfer;
    }
}

function startGame() {
    maxLaps = parseInt(lapInput.value, 10) || 3;
    player1.reset();
    player2.reset();
    
    // Give player 2 a slight advantage on reset position so they aren't completely overlapping if moved
    player1.y = startY_corrected - 20;
    player2.y = startY_corrected + 20;

    setupScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameState = 'PLAYING';
}

function endGame(winnerName) {
    gameState = 'GAMEOVER';
    winnerText.innerText = winnerName + ' Wins!';
    winnerText.style.color = winnerName.includes('Red') ? 'red' : 'blue';
    gameOverScreen.style.display = 'block';
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function update(deltaTime) {
    if (gameState !== 'PLAYING') return;

    player1.update();
    player2.update();
    
    resolveCollision(player1, player2);
}

function drawTrack() {
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.ellipse(trackConfig.centerX, trackConfig.centerY, trackConfig.radiusX, trackConfig.radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = trackConfig.thickness;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(trackConfig.centerX, trackConfig.centerY, trackConfig.radiusX - trackConfig.thickness/2, trackConfig.radiusY - trackConfig.thickness/2, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(trackConfig.centerX, trackConfig.centerY, trackConfig.radiusX + trackConfig.thickness/2, trackConfig.radiusY + trackConfig.thickness/2, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(trackConfig.centerX, trackConfig.centerY - trackConfig.radiusY);
    ctx.fillStyle = 'white';
    
    const w = 10;
    const h = trackConfig.thickness;
    const squareSize = 10;
    
    for (let x = -w/2; x < w/2; x += squareSize) {
        for (let y = -h/2; y < h/2; y += squareSize) {
            if ((Math.abs(x) + Math.abs(y)) % (squareSize * 2) === 0) {
                ctx.fillStyle = 'white';
            } else {
                ctx.fillStyle = 'black';
            }
            ctx.fillRect(x, y, squareSize, squareSize);
        }
    }
    ctx.restore();
}

function drawUI() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 80);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Target Laps: ' + maxLaps, 20, 30);
    
    ctx.fillStyle = 'red';
    ctx.fillText('Player 1 Laps: ' + player1.laps, 20, 55);
    
    ctx.fillStyle = '#3498db';
    ctx.fillText('Player 2 Laps: ' + player2.laps, 20, 75);
}

function draw() {
    drawTrack();

    player1.draw(ctx);
    player2.draw(ctx);

    if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
        drawUI();
    }
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Initial draw behind the setup screen
drawTrack();
player1.draw(ctx);
player2.draw(ctx);

requestAnimationFrame(gameLoop);
console.log('Game initialized with UI and Lap logic.');
