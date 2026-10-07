// Neon 2048 Engine with Undo & Touch Swipe
(() => {
    const boardEl = document.getElementById('grid-board');
    const scoreVal = document.getElementById('score-val');
    const highScoreVal = document.getElementById('high-score-val');
    const restartBtn = document.getElementById('restart-btn');
    const undoBtn = document.getElementById('undo-btn');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const overlayBtn = document.getElementById('overlay-btn');

    const SIZE = 4;
    let grid = [];
    let history = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('arcade_2048_hi') || '0', 10);
    let isGameOver = false;

    highScoreVal.textContent = highScore;

    function initBoard() {
        grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
        history = [];
        score = 0;
        isGameOver = false;
        scoreVal.textContent = score;
        overlay.classList.add('hidden');

        spawnTile();
        spawnTile();
        render();
    }

    function saveHistory() {
        history.push({
            grid: grid.map(row => [...row]),
            score: score
        });
        if (history.length > 20) history.shift();
    }

    function undo() {
        if (history.length === 0 || isGameOver) return;
        const prev = history.pop();
        grid = prev.grid;
        score = prev.score;
        scoreVal.textContent = score;
        if (window.arcadeAudio) window.arcadeAudio.playTone(300, 'sine', 0.05, 0.1);
        render();
    }

    function spawnTile() {
        const emptyCells = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (grid[r][c] === 0) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length === 0) return;
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    }

    function render() {
        // Keep overlay inside boardEl
        const tiles = boardEl.querySelectorAll('.tile');
        tiles.forEach(t => t.remove());

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const val = grid[r][c];
                const tile = document.createElement('div');
                tile.className = 'tile';
                if (val > 0) {
                    tile.textContent = val;
                    tile.dataset.val = val;
                }
                boardEl.appendChild(tile);
            }
        }
    }

    function slideRow(row) {
        let arr = row.filter(val => val !== 0);
        let pts = 0;
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                pts += arr[i];
                arr.splice(i + 1, 1);
            }
        }
        while (arr.length < SIZE) {
            arr.push(0);
        }
        return { row: arr, pts: pts };
    }

    function moveLeft() {
        let moved = false;
        let gained = 0;
        for (let r = 0; r < SIZE; r++) {
            const res = slideRow(grid[r]);
            if (res.row.some((v, idx) => v !== grid[r][idx])) moved = true;
            grid[r] = res.row;
            gained += res.pts;
        }
        return { moved, gained };
    }

    function rotateBoard() {
        const newGrid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                newGrid[c][SIZE - 1 - r] = grid[r][c];
            }
        }
        grid = newGrid;
    }

    function move(dir) {
        if (isGameOver) return;

        // Save state before move
        const prevGrid = grid.map(r => [...r]);
        const prevScore = score;

        // 0: left, 1: down, 2: right, 3: up
        let rotations = 0;
        if (dir === 'up') rotations = 3;
        if (dir === 'right') rotations = 2;
        if (dir === 'down') rotations = 1;

        for (let i = 0; i < rotations; i++) rotateBoard();

        const res = moveLeft();

        // Rotate back
        for (let i = 0; i < (4 - rotations) % 4; i++) rotateBoard();

        if (res.moved) {
            history.push({ grid: prevGrid, score: prevScore });
            score += res.gained;
            scoreVal.textContent = score;

            if (score > highScore) {
                highScore = score;
                highScoreVal.textContent = highScore;
                localStorage.setItem('arcade_2048_hi', highScore);
            }

            if (res.gained > 0 && window.arcadeAudio) {
                window.arcadeAudio.coin();
            } else if (window.arcadeAudio) {
                window.arcadeAudio.playTone(380, 'triangle', 0.04, 0.06);
            }

            spawnTile();
            render();
            checkGameOver();
        }
    }

    function checkGameOver() {
        // Any empty
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (grid[r][c] === 0) return;
                if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return;
                if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return;
            }
        }

        // No moves left
        isGameOver = true;
        if (window.arcadeAudio) window.arcadeAudio.gameover();
        overlayTitle.textContent = 'NO MOVES LEFT';
        overlaySubtitle.textContent = `FINAL SCORE: ${score}`;
        overlay.classList.remove('hidden');
    }

    // Touch Swipe Detection
    let touchStartX = 0, touchStartY = 0;
    boardEl.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    boardEl.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.hypot(dx, dy) < 25) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            move(dx > 0 ? 'right' : 'left');
        } else {
            move(dy > 0 ? 'down' : 'up');
        }
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); move('up'); }
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); move('down'); }
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); move('left'); }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); move('right'); }
        else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); }
    });

    restartBtn.addEventListener('click', initBoard);
    undoBtn.addEventListener('click', undo);
    overlayBtn.addEventListener('click', initBoard);

    initBoard();
})();
