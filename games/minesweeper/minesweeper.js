// Cyber Minesweeper Engine
(() => {
    const gridEl = document.getElementById('mine-grid');
    const timerEl = document.getElementById('timer-lcd');
    const minesEl = document.getElementById('mines-lcd');
    const faceBtn = document.getElementById('face-btn');
    const diffSelect = document.getElementById('diff-select');

    const CONFIGS = {
        beginner: { rows: 9, cols: 9, mines: 10, cellSize: 34 },
        intermediate: { rows: 16, cols: 16, mines: 40, cellSize: 28 },
        expert: { rows: 16, cols: 30, mines: 99, cellSize: 24 }
    };

    let config = CONFIGS.beginner;
    let grid = [];
    let firstClick = true;
    let timer = 0;
    let timerInterval = null;
    let flagsPlaced = 0;
    let isGameOver = false;

    function initGame() {
        if (timerInterval) clearInterval(timerInterval);
        timer = 0;
        timerEl.textContent = '000';
        firstClick = true;
        isGameOver = false;
        flagsPlaced = 0;
        faceBtn.textContent = '😎';

        config = CONFIGS[diffSelect.value] || CONFIGS.beginner;
        minesEl.textContent = String(config.mines).padStart(3, '0');

        gridEl.style.gridTemplateColumns = `repeat(${config.cols}, ${config.cellSize}px)`;
        gridEl.innerHTML = '';

        grid = [];
        for (let r = 0; r < config.rows; r++) {
            const row = [];
            for (let c = 0; c < config.cols; c++) {
                const cell = {
                    r, c,
                    mine: false,
                    revealed: false,
                    flagged: false,
                    count: 0,
                    el: document.createElement('div')
                };
                cell.el.className = 'cell';
                cell.el.style.width = `${config.cellSize}px`;
                cell.el.style.height = `${config.cellSize}px`;
                cell.el.style.fontSize = `${config.cellSize * 0.45}px`;

                // Events
                cell.el.addEventListener('click', (e) => handleCellClick(cell));
                cell.el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleCellFlag(cell);
                });

                gridEl.appendChild(cell.el);
                row.push(cell);
            }
            grid.push(row);
        }
    }

    function plantMines(safeR, safeC) {
        let planted = 0;
        while (planted < config.mines) {
            const r = Math.floor(Math.random() * config.rows);
            const c = Math.floor(Math.random() * config.cols);

            // Don't place on safe cell or its immediate neighbors
            if ((Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) || grid[r][c].mine) {
                continue;
            }

            grid[r][c].mine = true;
            planted++;
        }

        // Calculate counts
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                if (!grid[r][c].mine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && grid[nr][nc].mine) {
                                count++;
                            }
                        }
                    }
                    grid[r][c].count = count;
                }
            }
        }
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            timer++;
            timerEl.textContent = String(Math.min(999, timer)).padStart(3, '0');
        }, 1000);
    }

    function handleCellClick(cell) {
        if (isGameOver || cell.revealed || cell.flagged) return;

        if (firstClick) {
            firstClick = false;
            plantMines(cell.r, cell.c);
            startTimer();
        }

        if (cell.mine) {
            // Hit mine!
            cell.el.classList.add('mine-hit');
            triggerGameOver(false);
            return;
        }

        revealCell(cell);
        if (window.arcadeAudio) window.arcadeAudio.playTone(420, 'sine', 0.04, 0.08);

        checkWinCondition();
    }

    function handleCellFlag(cell) {
        if (isGameOver || cell.revealed) return;
        cell.flagged = !cell.flagged;
        if (cell.flagged) {
            cell.el.textContent = '🚩';
            flagsPlaced++;
            if (window.arcadeAudio) window.arcadeAudio.playTone(600, 'triangle', 0.04, 0.08);
        } else {
            cell.el.textContent = '';
            flagsPlaced--;
        }
        const remaining = Math.max(0, config.mines - flagsPlaced);
        minesEl.textContent = String(remaining).padStart(3, '0');
    }

    function revealCell(cell) {
        if (cell.revealed || cell.flagged) return;
        cell.revealed = true;
        cell.el.classList.add('revealed');

        if (cell.count > 0) {
            cell.el.textContent = cell.count;
            cell.el.dataset.count = cell.count;
        } else {
            // Flood fill empty neighbors
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = cell.r + dr, nc = cell.c + dc;
                    if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                        revealCell(grid[nr][nc]);
                    }
                }
            }
        }
    }

    function checkWinCondition() {
        let unrevealedSafeCells = 0;
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                if (!grid[r][c].mine && !grid[r][c].revealed) {
                    unrevealedSafeCells++;
                }
            }
        }

        if (unrevealedSafeCells === 0) {
            triggerGameOver(true);
        }
    }

    function triggerGameOver(won) {
        isGameOver = true;
        if (timerInterval) clearInterval(timerInterval);

        if (won) {
            faceBtn.textContent = '🏆';
            if (window.arcadeAudio) window.arcadeAudio.powerup();
        } else {
            faceBtn.textContent = '💥';
            if (window.arcadeAudio) window.arcadeAudio.explosion();

            // Reveal all mines
            for (let r = 0; r < config.rows; r++) {
                for (let c = 0; c < config.cols; c++) {
                    const cell = grid[r][c];
                    if (cell.mine && !cell.flagged) {
                        cell.el.textContent = '💣';
                        cell.el.classList.add('revealed');
                    }
                }
            }
        }
    }

    faceBtn.addEventListener('click', initGame);
    diffSelect.addEventListener('change', initGame);

    initGame();
})();
