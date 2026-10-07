// Retro Space Invaders with pixel aliens, bunker degradation & UFOs
(() => {
    const canvas = document.getElementById('invaders-canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('score-val');
    const highScoreVal = document.getElementById('high-score-val');
    const waveVal = document.getElementById('wave-val');
    const livesBox = document.getElementById('lives-box');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    canvas.width = 480;
    canvas.height = 560;

    // Sprite bit patterns (8x8)
    const ALIEN_SPRITES = {
        top: [
            [0,0,0,1,1,0,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,0,1,1,0,1,1],
            [1,1,1,1,1,1,1,1],
            [0,0,1,0,0,1,0,0],
            [0,1,0,1,1,0,1,0],
            [1,0,1,0,0,1,0,1]
        ],
        mid: [
            [0,0,1,0,0,1,0,0],
            [0,0,0,1,1,0,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,0,1,1,0,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,1,0,0,0,0,1,0],
            [0,0,1,0,0,1,0,0]
        ],
        bottom: [
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,1,1,1,1,1,1],
            [0,0,1,1,1,1,0,0],
            [0,1,1,0,0,1,1,0],
            [1,1,0,0,0,0,1,1]
        ]
    };

    let player = { x: 220, y: 510, width: 34, height: 18, speed: 4 };
    let playerBullets = [];
    let alienBullets = [];
    let aliens = [];
    let bunkers = [];
    let particles = [];
    let ufo = null;

    let alienDir = 1;
    let alienStepTimer = 0;
    let alienStepInterval = 650;
    let alienStepDown = false;
    let animFrame = 0;

    let score = 0;
    let highScore = parseInt(localStorage.getItem('arcade_invaders_hi') || '0', 10);
    let wave = 1;
    let lives = 3;
    let isRunning = false;
    let isGameOver = false;

    highScoreVal.textContent = highScore;

    const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false, Space: false };

    function createAliens() {
        aliens = [];
        const rows = 5;
        const cols = 9;
        const startX = 40;
        const startY = 65;
        const spacingX = 44;
        const spacingY = 32;

        for (let r = 0; r < rows; r++) {
            let type = 'bottom';
            let points = 10;
            let color = '#00ff88';
            if (r === 0) { type = 'top'; points = 30; color = '#ff007f'; }
            else if (r <= 2) { type = 'mid'; points = 20; color = '#00f0ff'; }

            for (let c = 0; c < cols; c++) {
                aliens.push({
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    width: 24,
                    height: 20,
                    type: type,
                    points: points,
                    color: color,
                    alive: true
                });
            }
        }
        alienDir = 1;
        alienStepInterval = Math.max(150, 650 - (wave - 1) * 80);
    }

    function createBunkers() {
        bunkers = [];
        const bunkerCount = 4;
        const bunkerWidth = 44;
        const bunkerHeight = 32;
        const spacing = (canvas.width - (bunkerCount * bunkerWidth)) / (bunkerCount + 1);

        for (let i = 0; i < bunkerCount; i++) {
            const bx = spacing + i * (bunkerWidth + spacing);
            const by = 430;
            const pixels = [];
            for (let py = 0; py < 8; py++) {
                for (let px = 0; px < 11; px++) {
                    // Archway cutout
                    if (py >= 5 && px >= 3 && px <= 7) continue;
                    // Top corners cut
                    if (py === 0 && (px <= 1 || px >= 9)) continue;
                    pixels.push({ x: bx + px * 4, y: by + py * 4, alive: true });
                }
            }
            bunkers.push(pixels);
        }
    }

    function updateLivesDisplay() {
        livesBox.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const d = document.createElement('div');
            d.className = 'life-icon';
            livesBox.appendChild(d);
        }
    }

    function createExplosion(x, y, color, count = 15) {
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

    function firePlayerBullet() {
        if (playerBullets.length >= 2 || !isRunning || isGameOver) return;
        playerBullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y - 4,
            width: 4,
            height: 12,
            speed: 7
        });
        if (window.arcadeAudio) window.arcadeAudio.laser();
    }

    function updateGame(deltaTime) {
        if (!isRunning || isGameOver) return;

        // Player movement
        if ((keys.ArrowLeft || keys.a) && player.x > 10) {
            player.x -= player.speed;
        }
        if ((keys.ArrowRight || keys.d) && player.x < canvas.width - player.width - 10) {
            player.x += player.speed;
        }

        // Player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const b = playerBullets[i];
            b.y -= b.speed;
            if (b.y < 0) {
                playerBullets.splice(i, 1);
                continue;
            }

            // Check alien collision
            let hit = false;
            for (let a of aliens) {
                if (a.alive && b.x < a.x + a.width && b.x + b.width > a.x &&
                    b.y < a.y + a.height && b.y + b.height > a.y) {
                    a.alive = false;
                    hit = true;
                    score += a.points;
                    scoreVal.textContent = score;
                    createExplosion(a.x + a.width/2, a.y + a.height/2, a.color, 12);
                    if (window.arcadeAudio) window.arcadeAudio.explosion();

                    if (score > highScore) {
                        highScore = score;
                        highScoreVal.textContent = highScore;
                        localStorage.setItem('arcade_invaders_hi', highScore);
                    }
                    break;
                }
            }

            // Check UFO collision
            if (!hit && ufo && b.x < ufo.x + ufo.width && b.x + b.width > ufo.x &&
                b.y < ufo.y + ufo.height && b.y + b.height > ufo.y) {
                hit = true;
                score += ufo.points;
                scoreVal.textContent = score;
                createExplosion(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, '#ffdd00', 25);
                if (window.arcadeAudio) window.arcadeAudio.powerup();
                ufo = null;
            }

            // Check bunker collision
            if (!hit) {
                for (let bunker of bunkers) {
                    for (let p of bunker) {
                        if (p.alive && b.x < p.x + 4 && b.x + b.width > p.x &&
                            b.y < p.y + 4 && b.y + b.height > p.y) {
                            p.alive = false;
                            hit = true;
                            break;
                        }
                    }
                    if (hit) break;
                }
            }

            if (hit) {
                playerBullets.splice(i, 1);
            }
        }

        // Alien stepping logic
        alienStepTimer += deltaTime;
        const aliveAliens = aliens.filter(a => a.alive);

        // Win wave condition
        if (aliveAliens.length === 0) {
            wave++;
            waveVal.textContent = wave;
            createAliens();
            return;
        }

        const stepRate = Math.max(70, alienStepInterval * (aliveAliens.length / 45));

        if (alienStepTimer > stepRate) {
            alienStepTimer = 0;
            animFrame = 1 - animFrame;

            let hitEdge = false;
            for (let a of aliveAliens) {
                if ((alienDir === 1 && a.x + a.width > canvas.width - 20) ||
                    (alienDir === -1 && a.x < 20)) {
                    hitEdge = true;
                    break;
                }
            }

            if (hitEdge) {
                alienDir = -alienDir;
                for (let a of aliveAliens) {
                    a.y += 18;
                    // Reached player level!
                    if (a.y + a.height >= player.y) {
                        gameOver();
                        return;
                    }
                }
            } else {
                for (let a of aliveAliens) {
                    a.x += alienDir * 12;
                }
            }

            // Play alien step sound
            if (window.arcadeAudio) window.arcadeAudio.playTone(110 + animFrame * 30, 'square', 0.05, 0.08);

            // Alien firing
            if (Math.random() < 0.35 && alienBullets.length < 5) {
                const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
                alienBullets.push({
                    x: shooter.x + shooter.width / 2,
                    y: shooter.y + shooter.height,
                    width: 3,
                    height: 10,
                    speed: 4 + wave * 0.3
                });
            }
        }

        // Alien bullets update
        for (let i = alienBullets.length - 1; i >= 0; i--) {
            const ab = alienBullets[i];
            ab.y += ab.speed;

            if (ab.y > canvas.height) {
                alienBullets.splice(i, 1);
                continue;
            }

            // Hit player
            if (ab.x < player.x + player.width && ab.x + ab.width > player.x &&
                ab.y < player.y + player.height && ab.y + ab.height > player.y) {
                alienBullets.splice(i, 1);
                playerHit();
                continue;
            }

            // Hit bunkers
            let hitBunker = false;
            for (let bunker of bunkers) {
                for (let p of bunker) {
                    if (p.alive && ab.x < p.x + 4 && ab.x + ab.width > p.x &&
                        ab.y < p.y + 4 && ab.y + ab.height > p.y) {
                        p.alive = false;
                        hitBunker = true;
                        break;
                    }
                }
                if (hitBunker) break;
            }
            if (hitBunker) {
                alienBullets.splice(i, 1);
            }
        }

        // Random UFO spawn
        if (!ufo && Math.random() < 0.001) {
            ufo = {
                x: -40,
                y: 35,
                width: 36,
                height: 16,
                speed: 2.2,
                points: Math.floor(Math.random() * 3 + 1) * 100
            };
        }
        if (ufo) {
            ufo.x += ufo.speed;
            if (ufo.x > canvas.width + 50) ufo = null;
        }

        // Particle update
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function playerHit() {
        lives--;
        updateLivesDisplay();
        createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff007f', 25);
        if (window.arcadeAudio) window.arcadeAudio.explosion();

        if (lives <= 0) {
            gameOver();
        } else {
            player.x = 220;
        }
    }

    function gameOver() {
        isGameOver = true;
        isRunning = false;
        if (window.arcadeAudio) window.arcadeAudio.gameover();
        overlayTitle.textContent = 'GAME OVER';
        overlayTitle.className = 'overlay-title gameover';
        overlaySubtitle.textContent = `FINAL SCORE: ${score}`;
        startBtn.textContent = 'DEFEND AGAIN';
        overlay.classList.remove('hidden');
    }

    function drawPixelSprite(sprite, x, y, pixelSize, color) {
        ctx.fillStyle = color;
        for (let r = 0; r < sprite.length; r++) {
            for (let c = 0; c < sprite[r].length; c++) {
                if (sprite[r][c] === 1) {
                    ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }

    function draw() {
        // Clear
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Player Ship
        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        // Ship base
        ctx.fillRect(player.x, player.y + 8, player.width, 10);
        // Ship turret
        ctx.fillRect(player.x + 8, player.y + 4, player.width - 16, 4);
        ctx.fillRect(player.x + 14, player.y, 6, 4);
        ctx.restore();

        // Draw Aliens
        for (let a of aliens) {
            if (!a.alive) continue;
            drawPixelSprite(ALIEN_SPRITES[a.type], a.x, a.y, 2.8, a.color);
        }

        // Draw UFO
        if (ufo) {
            ctx.save();
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.ellipse(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffee00';
            ctx.beginPath();
            ctx.arc(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2 - 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw Bunkers
        ctx.fillStyle = '#00f0ff';
        for (let bunker of bunkers) {
            for (let p of bunker) {
                if (p.alive) {
                    ctx.fillRect(p.x, p.y, 4, 4);
                }
            }
        }

        // Draw Player Bullets
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        for (let b of playerBullets) {
            ctx.fillRect(b.x, b.y, b.width, b.height);
        }

        // Draw Alien Bullets
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 8;
        for (let ab of alienBullets) {
            ctx.fillRect(ab.x, ab.y, ab.width, ab.height);
        }

        // Draw Particles
        for (let p of particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.restore();
        }
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = now - lastTime;
        lastTime = now;
        updateGame(dt);
        draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        score = 0;
        wave = 1;
        lives = 3;
        player.x = 220;
        playerBullets = [];
        alienBullets = [];
        particles = [];
        ufo = null;
        isGameOver = false;
        isRunning = true;

        scoreVal.textContent = score;
        waveVal.textContent = wave;
        updateLivesDisplay();
        createAliens();
        createBunkers();

        overlay.classList.add('hidden');
    }

    startBtn.addEventListener('click', startGame);

    window.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('hidden') === false) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                startGame();
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.ArrowLeft = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.ArrowRight = true;
        } else if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            firePlayerBullet();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = false;
    });

    // Mobile controls
    const mobLeft = document.getElementById('mob-left');
    const mobRight = document.getElementById('mob-right');
    const mobFire = document.getElementById('mob-fire');

    if (mobLeft) {
        mobLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
        mobLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
        mobRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
        mobRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
        mobFire.addEventListener('touchstart', (e) => { e.preventDefault(); firePlayerBullet(); });
    }

    updateLivesDisplay();
    createAliens();
    createBunkers();
    requestAnimationFrame(loop);
})();
