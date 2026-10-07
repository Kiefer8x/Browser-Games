// Retro Cyber Maze / Pac-Man Canvas Engine
(() => {
    const canvas = document.getElementById('pacman-canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('score-val');
    const highScoreVal = document.getElementById('high-score-val');
    const livesBox = document.getElementById('lives-box');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    const TILE = 20;
    // 19 cols x 21 rows classic compact map
    // 1: wall, 2: pellet, 3: power pellet, 0: empty, 4: ghost house
    const INITIAL_MAP = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
        [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
        [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
        [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
        [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
        [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
        [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
        [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
        [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const ROWS = INITIAL_MAP.length;
    const COLS = INITIAL_MAP[0].length;
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;

    let map = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('arcade_pacman_hi') || '0', 10);
    let lives = 3;
    let pelletsLeft = 0;
    let frightenedTimer = 0;
    let frightenedMultiplier = 1;
    let isGameOver = false;
    let isRunning = false;

    highScoreVal.textContent = highScore;

    let pacman = {
        x: 9, y: 16,
        tileX: 9, tileY: 16,
        dx: 0, dy: 0,
        nextDx: 0, nextDy: 0,
        speed: 0.12,
        mouthAngle: 0.2,
        mouthDir: 1
    };

    let ghosts = [];
    const GHOST_CONFIGS = [
        { name: 'Blinky', color: '#ff0055', x: 9, y: 8, targetX: 17, targetY: 1 },
        { name: 'Pinky', color: '#ff77aa', x: 9, y: 10, targetX: 1, targetY: 1 },
        { name: 'Inky', color: '#00f0ff', x: 8, y: 10, targetX: 17, targetY: 19 },
        { name: 'Clyde', color: '#ffaa00', x: 10, y: 10, targetX: 1, targetY: 19 }
    ];

    function initMap() {
        map = INITIAL_MAP.map(row => [...row]);
        pelletsLeft = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (map[r][c] === 2 || map[r][c] === 3) pelletsLeft++;
            }
        }
    }

    function initActors() {
        pacman.x = 9;
        pacman.y = 16;
        pacman.tileX = 9;
        pacman.tileY = 16;
        pacman.dx = -1;
        pacman.dy = 0;
        pacman.nextDx = -1;
        pacman.nextDy = 0;

        ghosts = GHOST_CONFIGS.map(cfg => ({
            ...cfg,
            x: cfg.x,
            y: cfg.y,
            dx: 0,
            dy: -1,
            speed: 0.09,
            frightened: false,
            eaten: false
        }));
    }

    function updateLivesDisplay() {
        livesBox.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const d = document.createElement('div');
            d.className = 'life-pac';
            livesBox.appendChild(d);
        }
    }

    function isWall(tileX, tileY) {
        // Wrap around side tunnels
        if (tileX < 0 || tileX >= COLS) return false;
        if (tileY < 0 || tileY >= ROWS) return true;
        return map[tileY][tileX] === 1 || map[tileY][tileX] === 4;
    }

    function updatePacman() {
        // Check if pacman is close to center of current tile
        const isAtTileCenter = Math.abs(pacman.x - Math.round(pacman.x)) < 0.08 &&
                               Math.abs(pacman.y - Math.round(pacman.y)) < 0.08;

        if (isAtTileCenter) {
            pacman.x = Math.round(pacman.x);
            pacman.y = Math.round(pacman.y);
            pacman.tileX = pacman.x;
            pacman.tileY = pacman.y;

            // Handle wrap tunnels
            if (pacman.tileX <= 0 && pacman.dx < 0) { pacman.x = COLS - 1; pacman.tileX = COLS - 1; }
            else if (pacman.tileX >= COLS - 1 && pacman.dx > 0) { pacman.x = 0; pacman.tileX = 0; }

            // Try to change direction to buffered next direction
            if (pacman.nextDx !== 0 || pacman.nextDy !== 0) {
                const nextTargetX = pacman.tileX + pacman.nextDx;
                const nextTargetY = pacman.tileY + pacman.nextDy;
                if (!isWall(nextTargetX, nextTargetY)) {
                    pacman.dx = pacman.nextDx;
                    pacman.dy = pacman.nextDy;
                }
            }

            // Stop if moving into a wall
            const targetX = pacman.tileX + pacman.dx;
            const targetY = pacman.tileY + pacman.dy;
            if (isWall(targetX, targetY)) {
                pacman.dx = 0;
                pacman.dy = 0;
            }

            // Pellet eating
            if (pacman.tileY >= 0 && pacman.tileY < ROWS && pacman.tileX >= 0 && pacman.tileX < COLS) {
                const currentCell = map[pacman.tileY][pacman.tileX];
                if (currentCell === 2) {
                    map[pacman.tileY][pacman.tileX] = 0;
                    score += 10;
                    pelletsLeft--;
                    scoreVal.textContent = score;
                    if (window.arcadeAudio) window.arcadeAudio.playTone(340, 'triangle', 0.03, 0.04);
                    checkWin();
                } else if (currentCell === 3) {
                    map[pacman.tileY][pacman.tileX] = 0;
                    score += 50;
                    pelletsLeft--;
                    scoreVal.textContent = score;
                    frightenedTimer = 350; // frames
                    frightenedMultiplier = 1;
                    ghosts.forEach(g => { if (!g.eaten) g.frightened = true; });
                    if (window.arcadeAudio) window.arcadeAudio.powerup();
                    checkWin();
                }
            }
        }

        // Apply movement
        pacman.x += pacman.dx * pacman.speed;
        pacman.y += pacman.dy * pacman.speed;

        // Animate mouth
        pacman.mouthAngle += 0.04 * pacman.mouthDir;
        if (pacman.mouthAngle > 0.35) pacman.mouthDir = -1;
        if (pacman.mouthAngle < 0.02) pacman.mouthDir = 1;

        if (score > highScore) {
            highScore = score;
            highScoreVal.textContent = highScore;
            localStorage.setItem('arcade_pacman_hi', highScore);
        }
    }

    function updateGhosts() {
        if (frightenedTimer > 0) {
            frightenedTimer--;
            if (frightenedTimer === 0) {
                ghosts.forEach(g => { g.frightened = false; g.eaten = false; });
            }
        }

        ghosts.forEach(ghost => {
            const isCenter = Math.abs(ghost.x - Math.round(ghost.x)) < 0.08 &&
                             Math.abs(ghost.y - Math.round(ghost.y)) < 0.08;

            if (isCenter) {
                ghost.x = Math.round(ghost.x);
                ghost.y = Math.round(ghost.y);

                // Check side tunnels
                if (ghost.x <= 0 && ghost.dx < 0) ghost.x = COLS - 1;
                else if (ghost.x >= COLS - 1 && ghost.dx > 0) ghost.x = 0;

                // Available valid directions (excluding exact reverse)
                const dirs = [
                    { dx: 0, dy: -1 },
                    { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 },
                    { dx: 1, dy: 0 }
                ].filter(d => {
                    if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
                    const nextX = ghost.x + d.dx;
                    const nextY = ghost.y + d.dy;
                    if (ghost.eaten && map[nextY] && map[nextY][nextX] === 4) return true; // Can enter house if eaten
                    return !isWall(nextX, nextY);
                });

                if (dirs.length > 0) {
                    let targetX = pacman.x;
                    let targetY = pacman.y;

                    if (ghost.eaten) {
                        targetX = 9; targetY = 9; // Return to ghost house
                        if (ghost.x === 9 && ghost.y === 9) {
                            ghost.eaten = false;
                            ghost.frightened = false;
                        }
                    } else if (ghost.frightened) {
                        // Pick random direction
                        const choice = dirs[Math.floor(Math.random() * dirs.length)];
                        ghost.dx = choice.dx;
                        ghost.dy = choice.dy;
                    } else {
                        // Choose direction minimizing distance to target
                        dirs.sort((a, b) => {
                            const dA = Math.hypot((ghost.x + a.dx) - targetX, (ghost.y + a.dy) - targetY);
                            const dB = Math.hypot((ghost.x + b.dx) - targetX, (ghost.y + b.dy) - targetY);
                            return dA - dB;
                        });
                        ghost.dx = dirs[0].dx;
                        ghost.dy = dirs[0].dy;
                    }
                }
            }

            const currentSpeed = ghost.eaten ? 0.16 : ghost.frightened ? 0.05 : ghost.speed;
            ghost.x += ghost.dx * currentSpeed;
            ghost.y += ghost.dy * currentSpeed;

            // Check collision with Pac-Man
            if (Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y) < 0.7) {
                if (ghost.frightened && !ghost.eaten) {
                    // Eat ghost
                    ghost.eaten = true;
                    ghost.frightened = false;
                    const ghostPts = 200 * frightenedMultiplier;
                    frightenedMultiplier *= 2;
                    score += ghostPts;
                    scoreVal.textContent = score;
                    if (window.arcadeAudio) window.arcadeAudio.coin();
                } else if (!ghost.eaten) {
                    // Pac-Man hit!
                    pacmanDied();
                }
            }
        });
    }

    function pacmanDied() {
        lives--;
        updateLivesDisplay();
        if (window.arcadeAudio) window.arcadeAudio.explosion();

        if (lives <= 0) {
            isGameOver = true;
            isRunning = false;
            if (window.arcadeAudio) window.arcadeAudio.gameover();
            overlayTitle.textContent = 'GAME OVER';
            overlayTitle.className = 'overlay-title gameover';
            overlaySubtitle.textContent = `FINAL SCORE: ${score}`;
            startBtn.textContent = 'PLAY AGAIN';
            overlay.classList.remove('hidden');
        } else {
            initActors();
        }
    }

    function checkWin() {
        if (pelletsLeft <= 0) {
            isGameOver = true;
            isRunning = false;
            if (window.arcadeAudio) window.arcadeAudio.powerup();
            overlayTitle.textContent = 'MAZE CLEARED!';
            overlayTitle.className = 'overlay-title start';
            overlaySubtitle.textContent = `BONUS SCORE: ${score}`;
            startBtn.textContent = 'NEXT LEVEL';
            overlay.classList.remove('hidden');
        }
    }

    function draw() {
        ctx.fillStyle = '#02040a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Map Walls & Pellets
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = map[r][c];
                const x = c * TILE;
                const y = r * TILE;

                if (cell === 1) {
                    // Neon Blue Wall
                    ctx.fillStyle = '#0a1738';
                    ctx.fillRect(x, y, TILE, TILE);
                    ctx.strokeStyle = '#0055ff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
                } else if (cell === 4) {
                    // Ghost Door
                    ctx.fillStyle = '#ff77aa';
                    ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
                } else if (cell === 2) {
                    // Small Pellet
                    ctx.fillStyle = '#ffeeaa';
                    ctx.beginPath();
                    ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (cell === 3) {
                    // Glowing Energizer
                    ctx.save();
                    ctx.fillStyle = '#ffee00';
                    ctx.shadowColor = '#ffee00';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(x + TILE / 2, y + TILE / 2, 5.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // Draw Pac-Man
        ctx.save();
        ctx.fillStyle = '#ffee00';
        ctx.shadowColor = '#ffee00';
        ctx.shadowBlur = 10;
        const px = pacman.x * TILE + TILE / 2;
        const py = pacman.y * TILE + TILE / 2;
        let rot = 0;
        if (pacman.dx === 1) rot = 0;
        else if (pacman.dy === 1) rot = Math.PI * 0.5;
        else if (pacman.dx === -1) rot = Math.PI;
        else if (pacman.dy === -1) rot = Math.PI * 1.5;

        ctx.beginPath();
        ctx.arc(px, py, TILE * 0.44, rot + pacman.mouthAngle * Math.PI, rot + (2 - pacman.mouthAngle) * Math.PI);
        ctx.lineTo(px, py);
        ctx.fill();
        ctx.restore();

        // Draw Ghosts
        ghosts.forEach(ghost => {
            const gx = ghost.x * TILE + TILE / 2;
            const gy = ghost.y * TILE + TILE / 2;
            const r = TILE * 0.44;

            ctx.save();
            if (ghost.eaten) {
                // Just eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(gx - 4, gy - 2, 3, 0, Math.PI * 2);
                ctx.arc(gx + 4, gy - 2, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#0055ff';
                ctx.beginPath();
                ctx.arc(gx - 4 + ghost.dx, gy - 2 + ghost.dy, 1.5, 0, Math.PI * 2);
                ctx.arc(gx + 4 + ghost.dx, gy - 2 + ghost.dy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = ghost.frightened ? (frightenedTimer < 60 && Math.floor(frightenedTimer / 10) % 2 === 0 ? '#ffffff' : '#0077ff') : ghost.color;
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8;

                // Dome head
                ctx.beginPath();
                ctx.arc(gx, gy - 2, r, Math.PI, 0, false);
                // Skirt tentacles
                ctx.lineTo(gx + r, gy + r);
                ctx.lineTo(gx + r * 0.4, gy + r * 0.6);
                ctx.lineTo(gx, gy + r);
                ctx.lineTo(gx - r * 0.4, gy + r * 0.6);
                ctx.lineTo(gx - r, gy + r);
                ctx.closePath();
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(gx - 4, gy - 3, 3, 0, Math.PI * 2);
                ctx.arc(gx + 4, gy - 3, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000033';
                ctx.beginPath();
                ctx.arc(gx - 4 + ghost.dx * 1.5, gy - 3 + ghost.dy * 1.5, 1.5, 0, Math.PI * 2);
                ctx.arc(gx + 4 + ghost.dx * 1.5, gy - 3 + ghost.dy * 1.5, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    function loop() {
        if (isRunning && !isGameOver) {
            updatePacman();
            updateGhosts();
        }
        draw();
        requestAnimationFrame(loop);
    }

    function setDirection(dx, dy) {
        pacman.nextDx = dx;
        pacman.nextDy = dy;
    }

    function startGame() {
        score = 0;
        lives = 3;
        scoreVal.textContent = score;
        updateLivesDisplay();
        initMap();
        initActors();
        isGameOver = false;
        isRunning = true;
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

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); setDirection(0, -1); }
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); setDirection(0, 1); }
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); setDirection(-1, 0); }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); setDirection(1, 0); }
    });

    // D-Pad
    document.querySelectorAll('.dpad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const dir = btn.dataset.dir;
            if (dir === 'up') setDirection(0, -1);
            if (dir === 'down') setDirection(0, 1);
            if (dir === 'left') setDirection(-1, 0);
            if (dir === 'right') setDirection(1, 0);
        });
    });

    initMap();
    initActors();
    updateLivesDisplay();
    requestAnimationFrame(loop);
})();
