// Cyber Arcade Hub - Portal Engine
(() => {
    // Game Catalog Registry
    const GAMES = [
        {
            id: 'tetris',
            title: 'Neon Tetris',
            category: 'arcade',
            badge: 'Classic Arcade',
            mode: '1 Player',
            icon: '🧱',
            path: 'games/tetris/index.html',
            description: 'Cyberpunk falling tetromino block stacker with SRS rotation, ghost piece, and level progression.',
            highScoreKey: 'arcade_tetris_hi'
        },
        {
            id: 'snake',
            title: 'Cyber Snake',
            category: 'arcade',
            badge: 'Classic Arcade',
            mode: '1 Player',
            icon: '🐍',
            path: 'games/snake/index.html',
            description: 'Neon glowing snake eating energy orbs and timed golden apples with particle fireworks.',
            highScoreKey: 'arcade_snake_hi'
        },
        {
            id: 'space-invaders',
            title: 'Space Invaders',
            category: 'action',
            badge: 'Action / Shooter',
            mode: '1 Player',
            icon: '👾',
            path: 'games/space-invaders/index.html',
            description: 'Galactic cannon defense against descending alien armada with destructible bunkers and UFOs.',
            highScoreKey: 'arcade_invaders_hi'
        },
        {
            id: 'asteroids',
            title: 'Asteroids Vector',
            category: 'action',
            badge: 'Action / Shooter',
            mode: '1 Player',
            icon: '🚀',
            path: 'games/asteroids/index.html',
            description: 'Inertial Newtonian space drift, laser cannons, splitting asteroids, and emergency hyperspace jump.',
            highScoreKey: 'arcade_asteroids_hi'
        },
        {
            id: 'pacman',
            title: 'Pac-Man Cyber Maze',
            category: 'arcade',
            badge: 'Classic Arcade',
            mode: '1 Player',
            icon: '🟡',
            path: 'games/pacman/index.html',
            description: 'Chomp pellets through retro labyrinths while outsmarting Blinky, Pinky, Inky, and Clyde.',
            highScoreKey: 'arcade_pacman_hi'
        },
        {
            id: 'pong',
            title: 'Cyber Pong',
            category: 'arcade',
            badge: 'Arcade Duel',
            mode: '1P vs AI / 2P Local',
            icon: '🏓',
            path: 'games/pong/index.html',
            description: 'The father of video games reborn in neon. Challenge 3 AI difficulties or play 2-Player local duels.',
            highScoreKey: null
        },
        {
            id: 'breakout',
            title: 'Neon Breakout',
            category: 'action',
            badge: 'Brick Breaker',
            mode: '1 Player',
            icon: '🧱',
            path: 'games/breakout/index.html',
            description: 'Shatter vibrant neon brick lattices with paddle spin, multi-ball, and paddle expander power-ups.',
            highScoreKey: 'arcade_breakout_hi'
        },
        {
            id: 'minesweeper',
            title: 'Cyber Minesweeper',
            category: 'puzzle',
            badge: 'Puzzle / Logic',
            mode: '1 Player',
            icon: '💣',
            path: 'games/minesweeper/index.html',
            description: 'Tactical minefield sweeping featuring Beginner, Intermediate, and Expert grid difficulties.',
            highScoreKey: null
        },
        {
            id: 'conan-barbarian',
            title: 'Conan: Hyborian Slayer',
            category: 'action',
            badge: 'Action / Platformer',
            mode: '1 Player',
            icon: '⚔️',
            path: 'games/conan-barbarian/index.html',
            description: 'Conan barbarian side-scrolling hack & slash combat through Stygian ruins with swords, blood, and boss battles.',
            highScoreKey: null
        },
        {
            id: 'retro-platformer',
            title: 'Super Retro Jump',
            category: 'action',
            badge: '2D Platformer',
            mode: '1 Player',
            icon: '🍄',
            path: 'games/retro-platformer/index.html',
            description: 'Classic 2D jump & run platformer with pipes, mystery ? blocks, floating coins, enemy stomping, and flagpole.',
            highScoreKey: null
        },
        {
            id: '2048',
            title: '2048 Neon',
            category: 'puzzle',
            badge: 'Puzzle / Logic',
            mode: '1 Player',
            icon: '🔢',
            path: 'games/2048/index.html',
            description: 'Addictive numbered tile sliding and merging puzzle with undo support and touch swipe controls.',
            highScoreKey: 'arcade_2048_hi'
        }
    ];

    // State
    let currentFilter = 'all';
    let searchQuery = '';
    let favorites = JSON.parse(localStorage.getItem('arcade_favorites') || '[]');

    // DOM Elements
    const gridEl = document.getElementById('games-grid');
    const searchInput = document.getElementById('search-input');
    const filterChips = document.querySelectorAll('.chip-btn');
    const surpriseBtn = document.getElementById('btn-surprise');
    const gamesCountEl = document.getElementById('games-count-badge');

    // Player Modal Elements
    const playerModal = document.getElementById('player-modal');
    const playerFrame = document.getElementById('player-frame');
    const modalTitle = document.getElementById('modal-title');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnNewTab = document.getElementById('btn-newtab');

    let activeGameUrl = '';

    // Render Games Grid
    function renderGames() {
        gridEl.innerHTML = '';

        const filtered = GAMES.filter(game => {
            // Category filter
            if (currentFilter === 'fav') {
                if (!favorites.includes(game.id)) return false;
            } else if (currentFilter !== 'all' && game.category !== currentFilter) {
                return false;
            }

            // Search query filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const match = game.title.toLowerCase().includes(q) ||
                              game.description.toLowerCase().includes(q) ||
                              game.badge.toLowerCase().includes(q);
                if (!match) return false;
            }

            return true;
        });

        if (gamesCountEl) {
            gamesCountEl.textContent = `${filtered.length} Games Available`;
        }

        if (filtered.length === 0) {
            gridEl.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🕹️</div>
                    <h3 style="color: #fff; margin-bottom: 0.5rem;">No games found</h3>
                    <p>Try refining your search term or select "All Games".</p>
                </div>
            `;
            return;
        }

        filtered.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';

            const isFav = favorites.includes(game.id);
            const hiScore = game.highScoreKey ? localStorage.getItem(game.highScoreKey) || '0' : null;

            card.innerHTML = `
                <div class="card-top">
                    <div class="card-icon-frame">${game.icon}</div>
                    <div class="card-badges">
                        <span class="badge badge-genre">${game.badge}</span>
                        <span class="badge badge-mode">${game.mode}</span>
                    </div>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${game.title}</h3>
                    <p class="card-desc">${game.description}</p>
                </div>
                ${hiScore !== null ? `
                    <div class="card-meta">
                        <span>Local Record</span>
                        <span class="high-score-tag">🏆 ${hiScore}</span>
                    </div>
                ` : ''}
                <div class="card-actions">
                    <button class="btn-play" data-game-id="${game.id}">
                        <span>▶</span> Play Now
                    </button>
                    <button class="btn-fav ${isFav ? 'active' : ''}" data-game-id="${game.id}" title="Toggle Favorite">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>
            `;

            // Mouse hover radial gradient glow tracker
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });

            // Action triggers
            card.querySelector('.btn-play').addEventListener('click', () => launchGame(game));
            card.querySelector('.btn-fav').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(game.id);
            });

            gridEl.appendChild(card);
        });
    }

    function toggleFavorite(id) {
        if (favorites.includes(id)) {
            favorites = favorites.filter(item => item !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem('arcade_favorites', JSON.stringify(favorites));
        renderGames();
    }

    function launchGame(game) {
        activeGameUrl = game.path;
        modalTitle.textContent = `${game.icon} ${game.title}`;
        playerFrame.src = game.path;
        playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePlayer() {
        playerModal.classList.remove('active');
        playerFrame.src = 'about:blank';
        activeGameUrl = '';
        document.body.style.overflow = '';
        // Re-render in case high-score updated
        renderGames();
    }

    // Modal controls - Only close via explicit Close button or Escape key (prevent accidental click outside)
    btnCloseModal.addEventListener('click', closePlayer);

    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            playerFrame.requestFullscreen().catch(err => {
                alert(`Error entering fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    btnNewTab.addEventListener('click', () => {
        if (activeGameUrl) {
            window.open(activeGameUrl, '_blank');
        }
    });

    // Escape closes modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && playerModal.classList.contains('active')) {
            closePlayer();
        }
    });

    // Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderGames();
        });
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGames();
    });

    // Surprise Me
    surpriseBtn.addEventListener('click', () => {
        const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
        launchGame(randomGame);
    });

    // Background Animated Particle & Starfield Grid
    function initBackground() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        const stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.6 + 0.2
        }));

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;
                if (s.x < 0) s.x = canvas.width;
                if (s.x > canvas.width) s.x = 0;
                if (s.y < 0) s.y = canvas.height;
                if (s.y > canvas.height) s.y = 0;

                ctx.fillStyle = `rgba(0, 240, 255, ${s.alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(animate);
        }
        animate();
    }

    initBackground();
    renderGames();
})();
