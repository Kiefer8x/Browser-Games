// Neon Cyber Tetris with Web Audio API sound effects
(() => {
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const holdCanvas = document.getElementById('hold-canvas');
    const holdCtx = holdCanvas.getContext('2d');
    const nextCanvas = document.getElementById('next-canvas');
    const nextCtx = nextCanvas.getContext('2d');

    const scoreEl = document.getElementById('score-val');
    const highscoreEl = document.getElementById('high-score-val');
    const linesEl = document.getElementById('lines-val');
    const levelEl = document.getElementById('level-val');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 26;

    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    holdCanvas.width = 4 * 20;
    holdCanvas.height = 4 * 20;
    nextCanvas.width = 4 * 20;
    nextCanvas.height = 4 * 20;

    const SHAPES = {
        'I': { color: '#00f0ff', matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
        'J': { color: '#0077ff', matrix: [[1,0,0],[1,1,1],[0,0,0]] },
        'L': { color: '#ffaa00', matrix: [[0,0,1],[1,1,1],[0,0,0]] },
        'O': { color: '#ffee00', matrix: [[1,1],[1,1]] },
        'S': { color: '#00ff88', matrix: [[0,1,1],[1,1,0],[0,0,0]] },
        'T': { color: '#b500ff', matrix: [[0,1,0],[1,1,1],[0,0,0]] },
        'Z': { color: '#ff0055', matrix: [[1,1,0],[0,1,1],[0,0,0]] }
    };
    const SHAPE_KEYS = Object.keys(SHAPES);

    let board = createMatrix(COLS, ROWS);
    let piece = null;
    let nextPieceType = null;
    let holdPieceType = null;
    let canHold = true;

    let dropCounter = 0;
    let dropInterval = 800;
    let lastTime = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let highScore = parseInt(localStorage.getItem('arcade_tetris_hi') || '0', 10);
    let isGameOver = false;
    let isPaused = false;
    let isRunning = false;
    let animFrameId = null;

    highscoreEl.textContent = highScore;

    function createMatrix(w, h) {
        const matrix = [];
        while (h--) matrix.push(new Array(w).fill(0));
        return matrix;
    }

    function randomPieceType() {
        return SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    }

    function createPiece(type) {
        return {
            type: type,
            matrix: SHAPES[type].matrix.map(row => [...row]),
            color: SHAPES[type].color,
            x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type].matrix[0].length / 2),
            y: 0
        };
    }

    function collide(b, p) {
        const m = p.matrix;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    const boardX = x + p.x;
                    const boardY = y + p.y;
                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                        return true;
                    }
                    if (boardY >= 0 && b[boardY][boardX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function merge(b, p) {
        p.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (y + p.y >= 0 && y + p.y < ROWS) {
                        b[y + p.y][x + p.x] = p.color;
                    }
                }
            });
        });
    }

    function rotate(matrix, dir) {
        const result = matrix.map((_, i) => matrix.map(row => row[i]));
        if (dir > 0) return result.map(row => row.reverse());
        return result.reverse();
    }

    function playerRotate(dir) {
        if (!piece || isGameOver || isPaused) return;
        const origMatrix = piece.matrix;
        const origX = piece.x;
        piece.matrix = rotate(piece.matrix, dir);

        // Wall kicks
        let offset = 1;
        while (collide(board, piece)) {
            piece.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > piece.matrix[0].length) {
                piece.matrix = origMatrix;
                piece.x = origX;
                return;
            }
        }
        if (window.arcadeAudio) window.arcadeAudio.playTone(400, 'triangle', 0.05, 0.1);
    }

    function playerMove(offset) {
        if (!piece || isGameOver || isPaused) return;
        piece.x += offset;
        if (collide(board, piece)) {
            piece.x -= offset;
        } else {
            if (window.arcadeAudio) window.arcadeAudio.playTone(280, 'sine', 0.04, 0.08);
        }
    }

    function playerDrop() {
        if (!piece || isGameOver || isPaused) return;
        piece.y++;
        if (collide(board, piece)) {
            piece.y--;
            merge(board, piece);
            if (window.arcadeAudio) window.arcadeAudio.playTone(180, 'square', 0.05, 0.1);
            arenaSweep();
            resetPiece();
        }
        dropCounter = 0;
    }

    function playerHardDrop() {
        if (!piece || isGameOver || isPaused) return;
        let droppedLines = 0;
        while (!collide(board, piece)) {
            piece.y++;
            droppedLines++;
        }
        piece.y--;
        score += (droppedLines * 2);
        scoreEl.textContent = score;
        merge(board, piece);
        if (window.arcadeAudio) window.arcadeAudio.hit();
        arenaSweep();
        resetPiece();
        dropCounter = 0;
    }

    function holdCurrentPiece() {
        if (!canHold || isGameOver || isPaused) return;
        if (window.arcadeAudio) window.arcadeAudio.playTone(550, 'triangle', 0.08, 0.1);
        if (holdPieceType === null) {
            holdPieceType = piece.type;
            piece = createPiece(nextPieceType);
            nextPieceType = randomPieceType();
            drawPreview(nextCtx, nextPieceType, 20);
        } else {
            const temp = holdPieceType;
            holdPieceType = piece.type;
            piece = createPiece(temp);
        }
        canHold = false;
        drawPreview(holdCtx, holdPieceType, 20);
    }

    function resetPiece() {
        piece = createPiece(nextPieceType);
        nextPieceType = randomPieceType();
        canHold = true;
        drawPreview(nextCtx, nextPieceType, 20);

        if (collide(board, piece)) {
            gameOver();
        }
    }

    function arenaSweep() {
        let clearedLines = 0;
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) continue outer;
            }
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y;
            clearedLines++;
        }

        if (clearedLines > 0) {
            const linePoints = [0, 100, 300, 500, 800];
            score += (linePoints[clearedLines] || 100) * level;
            lines += clearedLines;
            level = Math.floor(lines / 10) + 1;
            dropInterval = Math.max(100, 800 - (level - 1) * 70);

            scoreEl.textContent = score;
            linesEl.textContent = lines;
            levelEl.textContent = level;

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('arcade_tetris_hi', highScore);
                highscoreEl.textContent = highScore;
            }

            if (window.arcadeAudio) {
                if (clearedLines >= 4) window.arcadeAudio.powerup();
                else window.arcadeAudio.coin();
            }
        }
    }

    function getGhostPosition() {
        if (!piece) return 0;
        const ghost = { ...piece, y: piece.y };
        while (!collide(board, ghost)) {
            ghost.y++;
        }
        return ghost.y - 1;
    }

    function drawBlock(c, x, y, size, color, isGhost = false) {
        c.save();
        if (isGhost) {
            c.strokeStyle = color;
            c.lineWidth = 1.5;
            c.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
            c.fillStyle = color;
            c.globalAlpha = 0.15;
            c.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
        } else {
            c.fillStyle = color;
            c.fillRect(x * size, y * size, size, size);

            // 3D bevel / neon gloss
            c.fillStyle = 'rgba(255,255,255,0.3)';
            c.fillRect(x * size, y * size, size, 2);
            c.fillRect(x * size, y * size, 2, size);

            c.fillStyle = 'rgba(0,0,0,0.35)';
            c.fillRect(x * size, y * size + size - 2, size, 2);
            c.fillRect(x * size + size - 2, y * size, 2, size);
        }
        c.restore();
    }

    function drawPreview(c, type, size) {
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);
        if (!type) return;
        const m = SHAPES[type].matrix;
        const color = SHAPES[type].color;
        const offsetX = (c.canvas.width - m[0].length * size) / 2;
        const offsetY = (c.canvas.height - m.length * size) / 2;

        m.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    c.fillStyle = color;
                    c.fillRect(offsetX + x * size, offsetY + y * size, size - 1, size - 1);
                    c.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    c.fillRect(offsetX + x * size, offsetY + y * size, size - 1, 2);
                }
            });
        });
    }

    function draw() {
        // Clear board with subtle grid
        ctx.fillStyle = '#060810';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(canvas.width, y * BLOCK_SIZE);
            ctx.stroke();
        }

        // Settled board
        board.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color !== 0) {
                    drawBlock(ctx, x, y, BLOCK_SIZE, color);
                }
            });
        });

        if (piece) {
            // Draw Ghost Piece
            const ghostY = getGhostPosition();
            piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        drawBlock(ctx, x + piece.x, y + ghostY, BLOCK_SIZE, piece.color, true);
                    }
                });
            });

            // Draw Active Piece
            piece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        drawBlock(ctx, x + piece.x, y + piece.y, BLOCK_SIZE, piece.color);
                    }
                });
            });
        }
    }

    function update(time = 0) {
        if (!isRunning || isGameOver || isPaused) return;
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        animFrameId = requestAnimationFrame(update);
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

    function startGame() {
        board = createMatrix(COLS, ROWS);
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 800;
        dropCounter = 0;
        lastTime = performance.now();
        isGameOver = false;
        isPaused = false;
        isRunning = true;
        holdPieceType = null;
        canHold = true;

        scoreEl.textContent = score;
        linesEl.textContent = lines;
        levelEl.textContent = level;

        nextPieceType = randomPieceType();
        piece = createPiece(randomPieceType());
        drawPreview(nextCtx, nextPieceType, 20);
        drawPreview(holdCtx, null, 20);

        overlay.classList.add('hidden');
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(update);
    }

    startBtn.addEventListener('click', startGame);

    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('hidden') === false) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                startGame();
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            playerMove(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            playerMove(1);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            playerDrop();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            playerRotate(1);
        } else if (e.key === ' ' ) {
            e.preventDefault();
            playerHardDrop();
        } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
            e.preventDefault();
            holdCurrentPiece();
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            e.preventDefault();
            isPaused = !isPaused;
            if (!isPaused) {
                lastTime = performance.now();
                animFrameId = requestAnimationFrame(update);
            }
        }
    });

    // Touch controls
    document.querySelectorAll('.mob-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            if (action === 'left') playerMove(-1);
            if (action === 'right') playerMove(1);
            if (action === 'down') playerDrop();
            if (action === 'rotate') playerRotate(1);
            if (action === 'drop') playerHardDrop();
            if (action === 'hold') holdCurrentPiece();
        });
    });

    // Draw initial blank board
    draw();
})();
