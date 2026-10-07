// Neon Cyber Snake with Audio & Particle FX
(() => {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('score-val');
    const highScoreVal = document.getElementById('high-score-val');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    const GRID_SIZE = 20;
    const TILE_COUNT = 24;
    canvas.width = GRID_SIZE * TILE_COUNT;
    canvas.height = GRID_SIZE * TILE_COUNT;

    let snake = [];
    let velocity = { x: 0, y: 0 };
    let nextVelocity = { x: 0, y: 0 };
    let food = { x: 5, y: 5 };
    let bonusFood = null;
    let bonusTimer = 0;
    let particles = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('arcade_snake_hi') || '0', 10);
    let isGameOver = false;
    let isRunning = false;
    let gameLoopTimeout = null;
    let baseSpeed = 110;

    highScoreVal.textContent = highScore;

    function resetGame() {
        snake = [
            { x: 12, y: 12 },
            { x: 11, y: 12 },
            { x: 10, y: 12 }
        ];
        velocity = { x: 1, y: 0 };
        nextVelocity = { x: 1, y: 0 };
        score = 0;
        scoreVal.textContent = score;
        particles = [];
        bonusFood = null;
        bonusTimer = 0;
        isGameOver = false;
        isRunning = true;
        spawnFood();
        overlay.classList.add('hidden');

        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
        tick();
    }

    function spawnFood() {
        let valid = false;
        while (!valid) {
            food = {
                x: Math.floor(Math.random() * TILE_COUNT),
                y: Math.floor(Math.random() * TILE_COUNT)
            };
            valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
        }

        // Randomly spawn bonus golden apple
        if (!bonusFood && Math.random() < 0.25 && snake.length > 5) {
            let bValid = false;
            while (!bValid) {
                bonusFood = {
                    x: Math.floor(Math.random() * TILE_COUNT),
                    y: Math.floor(Math.random() * TILE_COUNT)
                };
                bValid = !snake.some(s => s.x === bonusFood.x && s.y === bonusFood.y) &&
                         (bonusFood.x !== food.x || bonusFood.y !== food.y);
            }
            bonusTimer = 60; // steps
        }
    }

    function createParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            particles.push({
                x: (x + 0.5) * GRID_SIZE,
                y: (y + 0.5) * GRID_SIZE,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                alpha: 1,
                radius: Math.random() * 3 + 2,
                life: 1
            });
        }
    }

    function tick() {
        if (!isRunning || isGameOver) return;

        velocity = { ...nextVelocity };
        const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

        // Wall collision
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            triggerGameOver();
            return;
        }

        // Self collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            triggerGameOver();
            return;
        }

        snake.unshift(head);

        // Food eaten
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreVal.textContent = score;
            createParticles(food.x, food.y, '#00ff88', 14);
            if (window.arcadeAudio) window.arcadeAudio.coin();
            checkHighScore();
            spawnFood();
        } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
            score += 50;
            scoreVal.textContent = score;
            createParticles(bonusFood.x, bonusFood.y, '#ffdd00', 25);
            if (window.arcadeAudio) window.arcadeAudio.powerup();
            bonusFood = null;
            checkHighScore();
        } else {
            snake.pop();
        }

        if (bonusFood) {
            bonusTimer--;
            if (bonusTimer <= 0) bonusFood = null;
        }

        draw();

        // Speed increases subtly with snake length
        const currentSpeed = Math.max(50, baseSpeed - Math.floor(snake.length * 1.2));
        gameLoopTimeout = setTimeout(tick, currentSpeed);
    }

    function checkHighScore() {
        if (score > highScore) {
            highScore = score;
            highScoreVal.textContent = highScore;
            localStorage.setItem('arcade_snake_hi', highScore);
        }
    }

    function triggerGameOver() {
        isGameOver = true;
        isRunning = false;
        createParticles(snake[0].x, snake[0].y, '#ff007f', 30);
        if (window.arcadeAudio) window.arcadeAudio.gameover();
        overlayTitle.textContent = 'GAME OVER';
        overlayTitle.className = 'overlay-title gameover';
        overlaySubtitle.textContent = `FINAL SCORE: ${score}`;
        startBtn.textContent = 'TRY AGAIN';
        overlay.classList.remove('hidden');
        draw();
    }

    function draw() {
        // Clear background
        ctx.fillStyle = '#060910';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < TILE_COUNT; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0);
            ctx.lineTo(i * GRID_SIZE, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE);
            ctx.lineTo(canvas.width, i * GRID_SIZE);
            ctx.stroke();
        }

        // Draw regular food (glowing emerald orb)
        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc((food.x + 0.5) * GRID_SIZE, (food.y + 0.5) * GRID_SIZE, GRID_SIZE * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw bonus food (pulsing gold orb)
        if (bonusFood) {
            ctx.save();
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#ffdd00';
            const pulse = Math.sin(performance.now() * 0.01) * 2;
            ctx.beginPath();
            ctx.arc((bonusFood.x + 0.5) * GRID_SIZE, (bonusFood.y + 0.5) * GRID_SIZE, (GRID_SIZE * 0.42) + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw snake
        snake.forEach((seg, index) => {
            ctx.save();
            const ratio = index / snake.length;
            if (index === 0) {
                // Head
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 14;
            } else {
                ctx.fillStyle = index % 2 === 0 ? '#00ff88' : '#00e577';
            }
            const pad = 1.5;
            const r = 5;
            const x = seg.x * GRID_SIZE + pad;
            const y = seg.y * GRID_SIZE + pad;
            const w = GRID_SIZE - pad * 2;
            const h = GRID_SIZE - pad * 2;

            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
            ctx.fill();

            // Head eyes
            if (index === 0) {
                ctx.fillStyle = '#0a0b10';
                const eyeOffset = 4;
                const eyeSize = 3;
                let ex1 = x + 4, ey1 = y + 4, ex2 = x + w - 7, ey2 = y + 4;
                if (velocity.y !== 0) {
                    ex1 = x + 4; ey1 = y + (velocity.y > 0 ? h - 7 : 4);
                    ex2 = x + w - 7; ey2 = ey1;
                } else if (velocity.x !== 0) {
                    ex1 = x + (velocity.x > 0 ? w - 7 : 4); ey1 = y + 4;
                    ex2 = ex1; ey2 = y + h - 7;
                }
                ctx.fillRect(ex1, ey1, eyeSize, eyeSize);
                ctx.fillRect(ex2, ey2, eyeSize, eyeSize);
            }
            ctx.restore();
        });

        // Update & draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function handleDirection(dx, dy) {
        if (!isRunning || isGameOver) return;
        // Prevent reverse direction
        if (dx !== 0 && velocity.x !== 0) return;
        if (dy !== 0 && velocity.y !== 0) return;
        nextVelocity = { x: dx, y: dy };
        if (window.arcadeAudio) window.arcadeAudio.playTone(320, 'sine', 0.03, 0.05);
    }

    window.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('hidden') === false) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                resetGame();
            }
            return;
        }

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault(); handleDirection(0, -1);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault(); handleDirection(0, 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault(); handleDirection(-1, 0);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault(); handleDirection(1, 0);
        }
    });

    startBtn.addEventListener('click', resetGame);

    document.querySelectorAll('.dpad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const dir = btn.dataset.dir;
            if (dir === 'up') handleDirection(0, -1);
            if (dir === 'down') handleDirection(0, 1);
            if (dir === 'left') handleDirection(-1, 0);
            if (dir === 'right') handleDirection(1, 0);
        });
    });

    draw();
})();
