// Cyber Pong with AI & 2-Player Local Mode
(() => {
    const canvas = document.getElementById('pong-canvas');
    const ctx = canvas.getContext('2d');
    const modeSelect = document.getElementById('game-mode');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    canvas.width = 640;
    canvas.height = 420;

    const PADDLE_WIDTH = 12;
    const PADDLE_HEIGHT = 76;
    const BALL_SIZE = 10;
    const WINNING_SCORE = 11;

    let player1 = { x: 25, y: canvas.height / 2 - PADDLE_HEIGHT / 2, score: 0, speed: 6 };
    let player2 = { x: canvas.width - 25 - PADDLE_WIDTH, y: canvas.height / 2 - PADDLE_HEIGHT / 2, score: 0, speed: 5.5 };
    let ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: 4.5,
        vy: 2,
        speed: 5
    };

    let particles = [];
    let isRunning = false;
    let isGameOver = false;
    let mode = '1p-medium'; // '1p-easy', '1p-medium', '1p-hard', '2p'

    const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };

    function resetBall(direction = 1) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speed = 5;
        const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
        ball.vx = direction * ball.speed * Math.cos(angle);
        ball.vy = ball.speed * Math.sin(angle);
    }

    function createSpark(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color,
                alpha: 1
            });
        }
    }

    function update() {
        if (!isRunning || isGameOver) return;

        // Player 1 controls (W / S or Arrow keys in 1P mode)
        if (mode.startsWith('1p')) {
            if (keys.w || keys.ArrowUp) player1.y -= player1.speed;
            if (keys.s || keys.ArrowDown) player1.y += player1.speed;
        } else {
            // In 2P mode, P1 is strictly W/S
            if (keys.w) player1.y -= player1.speed;
            if (keys.s) player1.y += player1.speed;
        }

        // Clamp P1
        player1.y = Math.max(10, Math.min(canvas.height - PADDLE_HEIGHT - 10, player1.y));

        // Player 2 controls / AI
        if (mode === '2p') {
            if (keys.ArrowUp) player2.y -= player2.speed;
            if (keys.ArrowDown) player2.y += player2.speed;
        } else {
            // AI logic
            const targetY = ball.y - PADDLE_HEIGHT / 2;
            let aiSpeed = 4.2;
            let errorMargin = 15;
            if (mode === '1p-easy') { aiSpeed = 3.2; errorMargin = 30; }
            if (mode === '1p-hard') { aiSpeed = 5.8; errorMargin = 5; }

            // Only track if ball is moving towards AI
            if (ball.vx > 0) {
                if (Math.abs(player2.y - targetY) > errorMargin) {
                    if (player2.y < targetY) player2.y += aiSpeed;
                    else if (player2.y > targetY) player2.y -= aiSpeed;
                }
            }
        }

        // Clamp P2
        player2.y = Math.max(10, Math.min(canvas.height - PADDLE_HEIGHT - 10, player2.y));

        // Ball movement
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Top / Bottom wall bounce
        if (ball.y - BALL_SIZE / 2 <= 0) {
            ball.y = BALL_SIZE / 2;
            ball.vy = -ball.vy;
            createSpark(ball.x, ball.y, '#00f0ff', 6);
            if (window.arcadeAudio) window.arcadeAudio.playTone(480, 'square', 0.04, 0.06);
        } else if (ball.y + BALL_SIZE / 2 >= canvas.height) {
            ball.y = canvas.height - BALL_SIZE / 2;
            ball.vy = -ball.vy;
            createSpark(ball.x, ball.y, '#00f0ff', 6);
            if (window.arcadeAudio) window.arcadeAudio.playTone(480, 'square', 0.04, 0.06);
        }

        // Paddle 1 Collision
        if (ball.x - BALL_SIZE / 2 <= player1.x + PADDLE_WIDTH &&
            ball.x + BALL_SIZE / 2 >= player1.x &&
            ball.y >= player1.y && ball.y <= player1.y + PADDLE_HEIGHT &&
            ball.vx < 0) {
            
            ball.speed = Math.min(11, ball.speed + 0.35);
            const relativeIntersectY = (player1.y + (PADDLE_HEIGHT / 2)) - ball.y;
            const normalizedRelativeIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
            const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 3.2);

            ball.vx = ball.speed * Math.cos(bounceAngle);
            ball.vy = -ball.speed * Math.sin(bounceAngle);
            createSpark(player1.x + PADDLE_WIDTH, ball.y, '#00f0ff', 12);
            if (window.arcadeAudio) window.arcadeAudio.hit();
        }

        // Paddle 2 Collision
        if (ball.x + BALL_SIZE / 2 >= player2.x &&
            ball.x - BALL_SIZE / 2 <= player2.x + PADDLE_WIDTH &&
            ball.y >= player2.y && ball.y <= player2.y + PADDLE_HEIGHT &&
            ball.vx > 0) {

            ball.speed = Math.min(11, ball.speed + 0.35);
            const relativeIntersectY = (player2.y + (PADDLE_HEIGHT / 2)) - ball.y;
            const normalizedRelativeIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
            const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 3.2);

            ball.vx = -ball.speed * Math.cos(bounceAngle);
            ball.vy = -ball.speed * Math.sin(bounceAngle);
            createSpark(player2.x, ball.y, '#ff007f', 12);
            if (window.arcadeAudio) window.arcadeAudio.hit();
        }

        // Score check
        if (ball.x < 0) {
            player2.score++;
            createSpark(0, ball.y, '#ff007f', 20);
            if (window.arcadeAudio) window.arcadeAudio.coin();
            checkMatchEnd();
            resetBall(1);
        } else if (ball.x > canvas.width) {
            player1.score++;
            createSpark(canvas.width, ball.y, '#00f0ff', 20);
            if (window.arcadeAudio) window.arcadeAudio.coin();
            checkMatchEnd();
            resetBall(-1);
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
            if (p.alpha <= 0) particles.splice(i, 1);
        }
    }

    function checkMatchEnd() {
        if (player1.score >= WINNING_SCORE || player2.score >= WINNING_SCORE) {
            isGameOver = true;
            isRunning = false;
            const p1Won = player1.score > player2.score;
            if (window.arcadeAudio) {
                if (p1Won) window.arcadeAudio.powerup();
                else window.arcadeAudio.gameover();
            }

            overlayTitle.textContent = p1Won ? (mode === '2p' ? 'PLAYER 1 WINS!' : 'VICTORY!') : (mode === '2p' ? 'PLAYER 2 WINS!' : 'DEFEAT!');
            overlayTitle.className = p1Won ? 'overlay-title start' : 'overlay-title gameover';
            overlaySubtitle.textContent = `FINAL SCORE: ${player1.score} - ${player2.score}`;
            startBtn.textContent = 'PLAY AGAIN';
            overlay.classList.remove('hidden');
        }
    }

    function draw() {
        // Clear
        ctx.fillStyle = '#040610';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Score display on canvas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = 'bold 48px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player1.score, canvas.width / 4, 70);
        ctx.fillText(player2.score, (canvas.width * 3) / 4, 70);

        // Paddle 1 (Cyan)
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(player1.x, player1.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.fill();
        ctx.restore();

        // Paddle 2 (Pink)
        ctx.save();
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(player2.x, player2.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.fill();
        ctx.restore();

        // Ball
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Particles
        for (let p of particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        player1.score = 0;
        player2.score = 0;
        player1.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
        player2.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
        isGameOver = false;
        isRunning = true;
        mode = modeSelect.value;
        resetBall(Math.random() < 0.5 ? 1 : -1);
        overlay.classList.add('hidden');
    }

    startBtn.addEventListener('click', startGame);

    modeSelect.addEventListener('change', () => {
        mode = modeSelect.value;
    });

    // Mouse / Touch movement tracking for P1
    canvas.addEventListener('mousemove', (e) => {
        if (!isRunning || isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        player1.y = mouseY - PADDLE_HEIGHT / 2;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isRunning || isGameOver) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        player1.y = touchY - PADDLE_HEIGHT / 2;
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('hidden') === false) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                startGame();
            }
            return;
        }

        if (e.key === 'w' || e.key === 'W') keys.w = true;
        if (e.key === 's' || e.key === 'S') keys.s = true;
        if (e.key === 'ArrowUp') { e.preventDefault(); keys.ArrowUp = true; }
        if (e.key === 'ArrowDown') { e.preventDefault(); keys.ArrowDown = true; }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'W') keys.w = false;
        if (e.key === 's' || e.key === 'S') keys.s = false;
        if (e.key === 'ArrowUp') keys.ArrowUp = false;
        if (e.key === 'ArrowDown') keys.ArrowDown = false;
    });

    requestAnimationFrame(loop);
})();
