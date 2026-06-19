const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speedX: 5,
    speedY: 5,
    color: 'white'
};

const paddleWidth = 10;
const paddleHeight = 100;

const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: 'white',
    score: 0,
    dy: 0,
    speed: 8
};

const ai = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: 'white',
    score: 0,
    dy: 0,
    speed: 5
};

// Key states
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    s: false
};

// Event listeners for keyboard
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

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = '45px Courier New';
    ctx.fillText(text, x, y);
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 40) {
        drawRect(canvas.width / 2 - 1, i, 2, 20, 'white');
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = -ball.speedX; // Serve to the other player
    ball.speedY = (Math.random() > 0.5 ? 1 : -1) * 5; // Random Y direction
}

function update() {
    // Player movement
    if ((keys.ArrowUp || keys.w) && player.y > 0) {
        player.y -= player.speed;
    }
    if ((keys.ArrowDown || keys.s) && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }

    // AI movement
    // Simple AI: follow the ball's Y position
    const aiCenter = ai.y + ai.height / 2;
    if (aiCenter < ball.y - 10) {
        ai.y += ai.speed;
    } else if (aiCenter > ball.y + 10) {
        ai.y -= ai.speed;
    }
    
    // AI boundary check
    if (ai.y < 0) ai.y = 0;
    if (ai.y > canvas.height - ai.height) ai.y = canvas.height - ai.height;

    // Ball movement
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
    }

    // Determine which paddle the ball is near
    let paddle = (ball.x < canvas.width / 2) ? player : ai;

    // Collision detection with paddle
    if (ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y) {
        
        // Reverse X direction
        ball.speedX = -ball.speedX;
        
        // Increase speed slightly
        if (Math.abs(ball.speedX) < 15) {
            ball.speedX *= 1.05;
            ball.speedY *= 1.05;
        }

        // Adjust Y speed based on where it hit the paddle (simple spin/angle effect)
        let collidePoint = ball.y - (paddle.y + paddle.height / 2);
        collidePoint = collidePoint / (paddle.height / 2);
        let angleRad = collidePoint * Math.PI / 4; // Max 45 degrees
        
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        let speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        
        ball.speedX = direction * speed * Math.cos(angleRad);
        ball.speedY = speed * Math.sin(angleRad);
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        ai.score++;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
    }
}

function render() {
    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, 'black');

    drawNet();

    // Draw scores
    drawText(player.score, canvas.width / 4, 50, 'white');
    drawText(ai.score, 3 * canvas.width / 4, 50, 'white');

    // Draw paddles
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);

    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
