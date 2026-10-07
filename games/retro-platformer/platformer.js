// Super Retro Jump — Classic 2D Platformer Engine
(() => {
    const canvas = document.getElementById('platformer-canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('score-val');
    const coinsVal = document.getElementById('coins-val');
    const livesVal = document.getElementById('lives-val');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    canvas.width = 720;
    canvas.height = 400;

    const GRAVITY = 0.58;
    const WORLD_WIDTH = 3200;

    let cameraX = 0;
    let score = 0;
    let coins = 0;
    let lives = 3;
    let isRunning = false;
    let isGameOver = false;

    let player = {
        x: 60,
        y: 280,
        vx: 0,
        vy: 0,
        w: 26,
        h: 36,
        speed: 4.5,
        facing: 1,
        onGround: false,
        invuln: 0
    };

    let platforms = [];
    let mysteryBlocks = [];
    let coinItems = [];
    let enemies = [];
    let particles = [];
    let flagPole = { x: 2950, y: 120, h: 230, reached: false };

    const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false, Space: false };

    function initLevel() {
        cameraX = 0;
        player.x = 60;
        player.y = 280;
        player.vx = 0;
        player.vy = 0;
        player.invuln = 0;
        flagPole.reached = false;

        // Ground & Platforms
        platforms = [
            // Ground chunks with pits
            { x: 0, y: 350, w: 900, h: 50 },
            { x: 980, y: 350, w: 750, h: 50 },
            { x: 1820, y: 350, w: 680, h: 50 },
            { x: 2580, y: 350, w: 620, h: 50 },

            // Raised Brick Platforms
            { x: 260, y: 260, w: 100, h: 22 },
            { x: 500, y: 230, w: 140, h: 22 },
            { x: 740, y: 200, w: 90, h: 22 },

            // Pipes
            { x: 420, y: 290, w: 46, h: 60, isPipe: true },
            { x: 680, y: 270, w: 46, h: 80, isPipe: true },
            { x: 1220, y: 280, w: 46, h: 70, isPipe: true },
            { x: 1540, y: 260, w: 46, h: 90, isPipe: true },
            { x: 2150, y: 270, w: 46, h: 80, isPipe: true },

            // Floating island steps
            { x: 1040, y: 270, w: 120, h: 22 },
            { x: 1320, y: 220, w: 160, h: 22 },
            { x: 1660, y: 260, w: 120, h: 22 },
            { x: 1940, y: 240, w: 140, h: 22 },
            { x: 2320, y: 280, w: 180, h: 22 },

            // Staircase to Flag
            { x: 2720, y: 320, w: 30, h: 30 },
            { x: 2750, y: 290, w: 30, h: 60 },
            { x: 2780, y: 260, w: 30, h: 90 },
            { x: 2810, y: 230, w: 30, h: 120 }
        ];

        // Mystery ? Blocks
        mysteryBlocks = [
            { x: 200, y: 240, w: 28, h: 28, hit: false, bumpY: 0 },
            { x: 300, y: 200, w: 28, h: 28, hit: false, bumpY: 0 },
            { x: 560, y: 170, w: 28, h: 28, hit: false, bumpY: 0 },
            { x: 1100, y: 210, w: 28, h: 28, hit: false, bumpY: 0 },
            { x: 1380, y: 160, w: 28, h: 28, hit: false, bumpY: 0 },
            { x: 2000, y: 180, w: 28, h: 28, hit: false, bumpY: 0 }
        ];

        // Floating Coins
        coinItems = [
            { x: 270, y: 220, w: 16, h: 16, taken: false },
            { x: 300, y: 220, w: 16, h: 16, taken: false },
            { x: 330, y: 220, w: 16, h: 16, taken: false },
            { x: 520, y: 190, w: 16, h: 16, taken: false },
            { x: 560, y: 190, w: 16, h: 16, taken: false },
            { x: 600, y: 190, w: 16, h: 16, taken: false },
            { x: 1060, y: 230, w: 16, h: 16, taken: false },
            { x: 1350, y: 180, w: 16, h: 16, taken: false },
            { x: 1680, y: 220, w: 16, h: 16, taken: false },
            { x: 1960, y: 200, w: 16, h: 16, taken: false }
        ];

        // Walking Enemies (Goombas / Slimes)
        enemies = [
            { x: 340, y: 320, vx: -1.2, w: 26, h: 24, alive: true },
            { x: 580, y: 320, vx: 1.2, w: 26, h: 24, alive: true },
            { x: 800, y: 320, vx: -1.2, w: 26, h: 24, alive: true },
            { x: 1120, y: 320, vx: 1.3, w: 26, h: 24, alive: true },
            { x: 1400, y: 320, vx: -1.3, w: 26, h: 24, alive: true },
            { x: 1680, y: 320, vx: 1.4, w: 26, h: 24, alive: true },
            { x: 1900, y: 320, vx: -1.4, w: 26, h: 24, alive: true },
            { x: 2240, y: 320, vx: 1.4, w: 26, h: 24, alive: true },
            { x: 2460, y: 320, vx: -1.4, w: 26, h: 24, alive: true }
        ];

        particles = [];
        updateHUD();
    }

    function updateHUD() {
        scoreVal.textContent = score;
        coinsVal.textContent = coins;
        livesVal.textContent = lives;
    }

    function spawnCoinParticle(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3 + 1;
            particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: '#ffdd00',
                alpha: 1,
                size: 3
            });
        }
    }

    function update() {
        if (!isRunning || isGameOver) return;

        // Player Movement
        if (keys.ArrowLeft || keys.a) {
            player.vx = -player.speed;
            player.facing = -1;
        } else if (keys.ArrowRight || keys.d) {
            player.vx = player.speed;
            player.facing = 1;
        } else {
            player.vx *= 0.75;
        }

        // Jump
        if ((keys.ArrowUp || keys.w || keys.Space) && player.onGround) {
            player.vy = -12.8;
            player.onGround = false;
            if (window.arcadeAudio) window.arcadeAudio.jump();
        }

        // Gravity
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;

        // Platform Collisions
        player.onGround = false;
        platforms.forEach(p => {
            if (player.x + player.w > p.x && player.x < p.x + p.w &&
                player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + player.vy) {
                if (player.vy >= 0) {
                    player.y = p.y - player.h;
                    player.vy = 0;
                    player.onGround = true;
                }
            }
        });

        // Mystery Blocks Hit Check
        mysteryBlocks.forEach(b => {
            // Decay bump animation
            if (b.bumpY < 0) b.bumpY += 1.5;

            // Hit from below
            if (!b.hit &&
                player.x + player.w > b.x && player.x < b.x + b.w &&
                player.y <= b.y + b.h && player.y >= b.y + b.h - 12 &&
                player.vy < 0) {
                
                b.hit = true;
                b.bumpY = -8;
                player.vy = 2; // bounce down
                coins++;
                score += 200;
                updateHUD();
                spawnCoinParticle(b.x + b.w / 2, b.y);
                if (window.arcadeAudio) window.arcadeAudio.coin();
            }

            // Stand on top of mystery block
            if (player.x + player.w > b.x && player.x < b.x + b.w &&
                player.y + player.h >= b.y && player.y + player.h <= b.y + b.h + player.vy &&
                player.vy >= 0) {
                player.y = b.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
        });

        // Coins Pickup
        coinItems.forEach(c => {
            if (c.taken) return;
            if (player.x + player.w > c.x && player.x < c.x + c.w &&
                player.y + player.h > c.y && player.y < c.y + c.h) {
                c.taken = true;
                coins++;
                score += 100;
                updateHUD();
                spawnCoinParticle(c.x + 8, c.y + 8);
                if (window.arcadeAudio) window.arcadeAudio.coin();
            }
        });

        // Enemies update & Stomp check
        enemies.forEach(e => {
            if (!e.alive) return;
            e.x += e.vx;

            // Turn around at edge of patrol
            if (Math.random() < 0.008) e.vx = -e.vx;

            // Collision with Player
            if (player.x + player.w > e.x && player.x < e.x + e.w &&
                player.y + player.h > e.y && player.y < e.y + e.h) {
                
                // Stomp on enemy head
                if (player.vy > 0 && player.y + player.h - player.vy <= e.y + 10) {
                    e.alive = false;
                    player.vy = -9; // bounce jump!
                    score += 250;
                    updateHUD();
                    spawnCoinParticle(e.x + e.w / 2, e.y);
                    if (window.arcadeAudio) window.arcadeAudio.hit();
                } else if (player.invuln <= 0) {
                    // Player hurt
                    playerHit();
                }
            }
        });

        // Invulnerability timer
        if (player.invuln > 0) player.invuln--;

        // Pit fall death
        if (player.y > 450) {
            playerHit(true);
        }

        // Camera follow
        const targetCamX = player.x - canvas.width * 0.35;
        cameraX += (targetCamX - cameraX) * 0.12;
        cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));

        // Reach Flag Pole (Win Level)
        if (!flagPole.reached && player.x >= flagPole.x - 10) {
            flagPole.reached = true;
            player.vx = 0;
            score += 2000;
            updateHUD();
            if (window.arcadeAudio) window.arcadeAudio.powerup();
            triggerVictory();
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) particles.splice(i, 1);
        }
    }

    function playerHit(instantDeath = false) {
        lives--;
        updateHUD();
        if (window.arcadeAudio) window.arcadeAudio.explosion();

        if (lives <= 0 || instantDeath) {
            if (lives <= 0) {
                triggerGameOver();
            } else {
                player.x = Math.max(60, player.x - 150);
                player.y = 260;
                player.vx = 0;
                player.vy = 0;
                player.invuln = 60;
            }
        } else {
            player.invuln = 60;
            player.vy = -6;
        }
    }

    function triggerGameOver() {
        isGameOver = true;
        isRunning = false;
        if (window.arcadeAudio) window.arcadeAudio.gameover();
        overlayTitle.textContent = 'GAME OVER';
        overlayTitle.className = 'overlay-title gameover';
        overlaySubtitle.textContent = `FINAL SCORE: ${score} • COINS: ${coins}`;
        startBtn.textContent = 'TRY AGAIN';
        overlay.classList.remove('hidden');
    }

    function triggerVictory() {
        isGameOver = true;
        isRunning = false;
        overlayTitle.textContent = 'COURSE CLEAR!';
        overlayTitle.className = 'overlay-title victory';
        overlaySubtitle.textContent = `Magnificent run! Final Score: ${score}`;
        startBtn.textContent = 'PLAY AGAIN';
        overlay.classList.remove('hidden');
    }

    function draw() {
        // Sky Background
        ctx.fillStyle = '#060c22';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Distant Hills & Clouds
        ctx.fillStyle = '#0b1638';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc((i * 450) - cameraX * 0.2, 350, 160, Math.PI, 0);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Draw Platforms & Ground
        platforms.forEach(p => {
            if (p.isPipe) {
                // Retro Warp Pipe
                ctx.fillStyle = '#00aa44';
                ctx.fillRect(p.x, p.y + 12, p.w, p.h - 12);
                ctx.fillStyle = '#00dd55';
                ctx.fillRect(p.x - 4, p.y, p.w + 8, 14); // Lip
                ctx.strokeStyle = '#004411';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - 4, p.y, p.w + 8, 14);
            } else {
                // Ground / Brick block
                ctx.fillStyle = '#182444';
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(p.x, p.y, p.w, p.h);

                // Neon trim
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(p.x, p.y, p.w, 3);
            }
        });

        // Mystery Blocks
        mysteryBlocks.forEach(b => {
            const y = b.y + b.bumpY;
            ctx.fillStyle = b.hit ? '#334466' : '#ff9900';
            ctx.fillRect(b.x, y, b.w, b.h);
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, y, b.w, b.h);

            // Question mark
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.hit ? '•' : '?', b.x + b.w / 2, y + 20);
        });

        // Floating Coins
        coinItems.forEach(c => {
            if (c.taken) return;
            ctx.save();
            ctx.fillStyle = '#ffdd00';
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(c.x + 8, c.y + 8, 7, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Enemies
        enemies.forEach(e => {
            if (!e.alive) return;
            ctx.save();
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(e.x, e.y, e.w, e.h, 6);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(e.x + 4, e.y + 5, 4, 6);
            ctx.fillRect(e.x + 14, e.y + 5, 4, 6);
            ctx.restore();
        });

        // Flag Pole & Castle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(flagPole.x, flagPole.y, 6, flagPole.h);
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(flagPole.x + 3, flagPole.y, 8, 0, Math.PI * 2);
        ctx.fill();
        // Flag Banner
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(flagPole.x + 6, flagPole.y + 10);
        ctx.lineTo(flagPole.x + 36, flagPole.y + 25);
        ctx.lineTo(flagPole.x + 6, flagPole.y + 40);
        ctx.closePath();
        ctx.fill();

        // Player (Plumber Hero)
        if (lives > 0) {
            ctx.save();
            if (player.invuln > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            // Cap & Shirt (Neon Blue)
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(player.x + 4, player.y, 18, 10); // cap
            ctx.fillRect(player.x + 2, player.y + 10, 22, 12); // shirt

            // Overalls (Red / Orange)
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(player.x + 4, player.y + 20, 18, 10); // pants
            ctx.fillRect(player.x + 2, player.y + 30, 8, 6); // left foot
            ctx.fillRect(player.x + 16, player.y + 30, 8, 6); // right foot
            ctx.restore();
        }

        // Particles
        particles.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore();
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        score = 0;
        coins = 0;
        lives = 3;
        isGameOver = false;
        isRunning = true;
        initLevel();
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

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
            e.preventDefault();
            keys.ArrowUp = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.ArrowUp = false;
    });

    // Mobile buttons
    const mobLeft = document.getElementById('mob-left');
    const mobRight = document.getElementById('mob-right');
    const mobJump = document.getElementById('mob-jump');

    if (mobLeft) {
        mobLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
        mobLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
        mobRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
        mobRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
        mobJump.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowUp = true; });
        mobJump.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowUp = false; });
    }

    initLevel();
    requestAnimationFrame(loop);
})();
