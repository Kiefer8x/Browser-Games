// Neon Cyber Breakout with Power-ups & Particle Explosions
(() => {
    const canvas = document.getElementById('breakout-canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('score-val');
    const highScoreVal = document.getElementById('high-score-val');
    const livesVal = document.getElementById('lives-val');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    canvas.width = 480;
    canvas.height = 560;

    let paddle = {
        x: 200,
        y: 520,
        width: 80,
        height: 12,
        speed: 7,
        dx: 0
    };

    let balls = [];
    let bricks = [];
    let powerups = [];
    let particles = [];

    let score = 0;
    let highScore = parseInt(localStorage.getItem('arcade_breakout_hi') || '0', 10);
    let lives = 3;
    let level = 1;
    let isRunning = false;
    let isGameOver = false;

    const BRICK_ROWS = 6;
    const BRICK_COLS = 8;
    const BRICK_PAD = 6;
    const BRICK_OFFSET_TOP = 50;
    const BRICK_OFFSET_LEFT = 20;
    const BRICK_WIDTH = 50;
    const BRICK_HEIGHT = 16;

    const ROW_COLORS = ['#ff0055', '#ff7700', '#ffee00', '#00ff88', '#00f0ff', '#b500ff'];

    highScoreVal.textContent = highScore;

    function initBricks() {
        bricks = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                bricks.push({
                    x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PAD),
                    y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PAD),
                    color: ROW_COLORS[r],
                    points: (BRICK_ROWS - r) * 10,
                    alive: true
                });
            }
        }
    }

    function spawnBall() {
        return {
            x: paddle.x + paddle.width / 2,
            y: paddle.y - 10,
            radius: 5,
            vx: (Math.random() - 0.5) * 4,
            vy: -5,
            speed: 5
        };
    }

    function createExplosion(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color,
                alpha: 1,
                size: Math.random() * 3 + 1
            });
        }
    }

    function update() {
        if (!isRunning || isGameOver) return;

        // Move paddle
        paddle.x += paddle.dx;
        paddle.x = Math.max(10, Math.min(canvas.width - paddle.width - 10, paddle.x));

        // Update Balls
        for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            b.x += b.vx;
            b.y += b.vy;

            // Wall collisions
            if (b.x - b.radius <= 0) {
                b.x = b.radius;
                b.vx = -b.vx;
                if (window.arcadeAudio) window.arcadeAudio.playTone(400, 'square', 0.03, 0.05);
            } else if (b.x + b.radius >= canvas.width) {
                b.x = canvas.width - b.radius;
                b.vx = -b.vx;
                if (window.arcadeAudio) window.arcadeAudio.playTone(400, 'square', 0.03, 0.05);
            }
            if (b.y - b.radius <= 0) {
                b.y = b.radius;
                b.vy = -b.vy;
                if (window.arcadeAudio) window.arcadeAudio.playTone(400, 'square', 0.03, 0.05);
            }

            // Paddle collision
            if (b.y + b.radius >= paddle.y && b.y - b.radius <= paddle.y + paddle.height &&
                b.x >= paddle.x && b.x <= paddle.x + paddle.width && b.vy > 0) {
                
                const hitPos = (b.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                b.vx = hitPos * 5.5;
                b.vy = -Math.sqrt(Math.max(16, b.speed * b.speed - b.vx * b.vx));
                createExplosion(b.x, paddle.y, '#00f0ff', 6);
                if (window.arcadeAudio) window.arcadeAudio.hit();
            }

            // Brick collision
            for (let brick of bricks) {
                if (brick.alive &&
                    b.x + b.radius > brick.x && b.x - b.radius < brick.x + BRICK_WIDTH &&
                    b.y + b.radius > brick.y && b.y - b.radius < brick.y + BRICK_HEIGHT) {
                    
                    brick.alive = false;
                    b.vy = -b.vy;
                    score += brick.points;
                    scoreVal.textContent = score;
                    createExplosion(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2, brick.color, 14);

                    if (window.arcadeAudio) window.arcadeAudio.coin();

                    if (score > highScore) {
                        highScore = score;
                        highScoreVal.textContent = highScore;
                        localStorage.setItem('arcade_breakout_hi', highScore);
                    }

                    // Chance to drop powerup
                    if (Math.random() < 0.22) {
                        const types = ['multiball', 'wide'];
                        powerups.push({
                            x: brick.x + BRICK_WIDTH / 2,
                            y: brick.y + BRICK_HEIGHT / 2,
                            type: types[Math.floor(Math.random() * types.length)],
                            vy: 2.2
                        });
                    }
                    break;
                }
            }

            // Ball drop out
            if (b.y - b.radius > canvas.height) {
                balls.splice(i, 1);
            }
        }

        // Check if all balls lost
        if (balls.length === 0) {
            lives--;
            livesVal.textContent = lives;
            paddle.width = 80;
            if (window.arcadeAudio) window.arcadeAudio.explosion();

            if (lives <= 0) {
                gameOver();
            } else {
                balls.push(spawnBall());
            }
        }

        // Powerups update
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.y += p.vy;

            // Catch powerup
            if (p.y >= paddle.y && p.y <= paddle.y + paddle.height &&
                p.x >= paddle.x && p.x <= paddle.x + paddle.width) {
                
                if (p.type === 'multiball') {
                    balls.push(spawnBall(), spawnBall());
                } else if (p.type === 'wide') {
                    paddle.width = Math.min(130, paddle.width + 30);
                }
                if (window.arcadeAudio) window.arcadeAudio.powerup();
                powerups.splice(i, 1);
                continue;
            }

            if (p.y > canvas.height) powerups.splice(i, 1);
        }

        // Check win / level complete
        if (bricks.every(b => !b.alive)) {
            level++;
            initBricks();
            balls = [spawnBall()];
            if (window.arcadeAudio) window.arcadeAudio.powerup();
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= 0.04;
            if (pt.alpha <= 0) particles.splice(i, 1);
        }
    }

    function gameOver() {
        isGameOver = true;
        isRunning = false;
        if (window.arcadeAudio) window.arcadeAudio.gameover();
        overlayTitle.textContent = 'GAME OVER';
        overlayTitle.className = 'overlay-title gameover';
        overlaySubtitle.textContent = `FINAL SCORE: ${score}`;
        startBtn.textContent = 'PLAY AGAIN';
        overlay.classList.remove('hidden');
    }

    function draw() {
        ctx.fillStyle = '#030409';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bricks
        for (let brick of bricks) {
            if (!brick.alive) continue;
            ctx.save();
            ctx.fillStyle = brick.color;
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
            ctx.fill();

            // Specular sheen
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, 2);
            ctx.restore();
        }

        // Paddle
        ctx.save();
        ctx.fillStyle = '#ff7700';
        ctx.shadowColor = '#ff7700';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
        ctx.fill();
        ctx.restore();

        // Balls
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        for (let b of balls) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Powerups
        for (let p of powerups) {
            ctx.save();
            ctx.fillStyle = p.type === 'multiball' ? '#00ff88' : '#ffee00';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Particles
        for (let pt of particles) {
            ctx.save();
            ctx.globalAlpha = pt.alpha;
            ctx.fillStyle = pt.color;
            ctx.shadowColor = pt.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
            ctx.restore();
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        score = 0;
        lives = 3;
        paddle.x = 200;
        paddle.width = 80;
        paddle.dx = 0;
        scoreVal.textContent = score;
        livesVal.textContent = lives;
        initBricks();
        balls = [spawnBall()];
        powerups = [];
        particles = [];
        isGameOver = false;
        isRunning = true;
        overlay.classList.add('hidden');
    }

    startBtn.addEventListener('click', startGame);

    // Mouse / Touch movement
    canvas.addEventListener('mousemove', (e) => {
        if (!isRunning || isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        paddle.x = mouseX - paddle.width / 2;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isRunning || isGameOver) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        paddle.x = touchX - paddle.width / 2;
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

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            paddle.dx = -paddle.speed;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            paddle.dx = paddle.speed;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
            e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            paddle.dx = 0;
        }
    });

    initBricks();
    balls = [spawnBall()];
    requestAnimationFrame(loop);
})();
