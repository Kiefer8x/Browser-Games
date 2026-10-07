// Vector Asteroids with Inertial Physics, Asteroid Splitting & Hyperspace
(() => {
    const canvas = document.getElementById('asteroids-canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('score-val');
    const highScoreVal = document.getElementById('high-score-val');
    const livesVal = document.getElementById('lives-val');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    canvas.width = 540;
    canvas.height = 540;

    const SHIP_SIZE = 14;
    const ROT_SPEED = Math.PI * 1.2; // rad/s
    const THRUST = 220; // px/s^2
    const FRICTION = 0.985;

    let ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE,
        a: -Math.PI / 2,
        rot: 0,
        thrusting: false,
        thrust: { x: 0, y: 0 }
    };

    let asteroids = [];
    let lasers = [];
    let particles = [];
    let stars = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('arcade_asteroids_hi') || '0', 10);
    let lives = 3;
    let level = 1;
    let isGameOver = false;
    let isRunning = false;
    let invulnerableTimer = 0;

    highScoreVal.textContent = highScore;

    // Background starfield
    for (let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.7 + 0.3
        });
    }

    function createAsteroidBelt() {
        asteroids = [];
        const num = 4 + level;
        for (let i = 0; i < num; i++) {
            let x, y, dist;
            do {
                x = Math.random() * canvas.width;
                y = Math.random() * canvas.height;
                dist = Math.hypot(x - ship.x, y - ship.y);
            } while (dist < 100);

            asteroids.push(createAsteroid(x, y, 40));
        }
    }

    function createAsteroid(x, y, radius) {
        const lvl = radius > 30 ? 3 : radius > 18 ? 2 : 1;
        const vert = Math.floor(Math.random() * 5 + 8);
        const offsets = [];
        for (let i = 0; i < vert; i++) {
            offsets.push(Math.random() * 0.4 + 0.8);
        }

        const speed = (Math.random() * 40 + 30) * (4 - lvl) * 0.6;
        const angle = Math.random() * Math.PI * 2;

        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            vert: vert,
            offsets: offsets,
            level: lvl
        };
    }

    function createExplosion(x, y, color, count = 16) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 20;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                alpha: 1,
                life: Math.random() * 0.4 + 0.3
            });
        }
    }

    function shootLaser() {
        if (!isRunning || isGameOver || lasers.length >= 4) return;
        lasers.push({
            x: ship.x + (4/3) * ship.r * Math.cos(ship.a),
            y: ship.y + (4/3) * ship.r * Math.sin(ship.a),
            vx: 450 * Math.cos(ship.a),
            vy: 450 * Math.sin(ship.a),
            life: 1.2
        });
        if (window.arcadeAudio) window.arcadeAudio.laser();
    }

    function hyperspace() {
        if (!isRunning || isGameOver) return;
        createExplosion(ship.x, ship.y, '#00f0ff', 20);
        ship.x = Math.random() * canvas.width;
        ship.y = Math.random() * canvas.height;
        ship.thrust = { x: 0, y: 0 };
        invulnerableTimer = 1.5;
        if (window.arcadeAudio) window.arcadeAudio.powerup();
    }

    function update(dt) {
        if (!isRunning || isGameOver) return;

        if (invulnerableTimer > 0) invulnerableTimer -= dt;

        // Ship rotation
        ship.a += ship.rot * dt;

        // Ship thrust
        if (ship.thrusting) {
            ship.thrust.x += THRUST * Math.cos(ship.a) * dt;
            ship.thrust.y += THRUST * Math.sin(ship.a) * dt;
            // Thruster particle
            if (Math.random() < 0.5) {
                particles.push({
                    x: ship.x - ship.r * Math.cos(ship.a),
                    y: ship.y - ship.r * Math.sin(ship.a),
                    vx: -Math.cos(ship.a) * 60 + (Math.random() - 0.5) * 20,
                    vy: -Math.sin(ship.a) * 60 + (Math.random() - 0.5) * 20,
                    color: '#ff9900',
                    alpha: 0.8,
                    life: 0.2
                });
            }
        } else {
            ship.thrust.x *= Math.pow(FRICTION, dt * 60);
            ship.thrust.y *= Math.pow(FRICTION, dt * 60);
        }

        // Ship position
        ship.x += ship.thrust.x * dt;
        ship.y += ship.thrust.y * dt;

        // Screen wrap for ship
        if (ship.x < 0) ship.x = canvas.width;
        else if (ship.x > canvas.width) ship.x = 0;
        if (ship.y < 0) ship.y = canvas.height;
        else if (ship.y > canvas.height) ship.y = 0;

        // Lasers update
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            l.x += l.vx * dt;
            l.y += l.vy * dt;
            l.life -= dt;

            // Wrap lasers
            if (l.x < 0) l.x = canvas.width;
            else if (l.x > canvas.width) l.x = 0;
            if (l.y < 0) l.y = canvas.height;
            else if (l.y > canvas.height) l.y = 0;

            if (l.life <= 0) {
                lasers.splice(i, 1);
                continue;
            }

            // Laser - Asteroid collision
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const a = asteroids[j];
                if (Math.hypot(l.x - a.x, l.y - a.y) < a.radius) {
                    createExplosion(a.x, a.y, '#00f0ff', 15);
                    if (window.arcadeAudio) window.arcadeAudio.explosion();

                    const pts = a.level === 3 ? 20 : a.level === 2 ? 50 : 100;
                    score += pts;
                    scoreVal.textContent = score;
                    if (score > highScore) {
                        highScore = score;
                        highScoreVal.textContent = highScore;
                        localStorage.setItem('arcade_asteroids_hi', highScore);
                    }

                    // Split asteroid
                    if (a.radius > 16) {
                        asteroids.push(createAsteroid(a.x, a.y, a.radius / 2));
                        asteroids.push(createAsteroid(a.x, a.y, a.radius / 2));
                    }
                    asteroids.splice(j, 1);
                    lasers.splice(i, 1);
                    break;
                }
            }
        }

        // Asteroids update
        for (let i = 0; i < asteroids.length; i++) {
            const a = asteroids[i];
            a.x += a.vx * dt;
            a.y += a.vy * dt;

            // Screen wrap
            if (a.x < -a.radius) a.x = canvas.width + a.radius;
            else if (a.x > canvas.width + a.radius) a.x = -a.radius;
            if (a.y < -a.radius) a.y = canvas.height + a.radius;
            else if (a.y > canvas.height + a.radius) a.y = -a.radius;

            // Collision with ship
            if (invulnerableTimer <= 0 && Math.hypot(ship.x - a.x, ship.y - a.y) < ship.r + a.radius) {
                shipDestroyed();
                return;
            }
        }

        // Level clear
        if (asteroids.length === 0) {
            level++;
            createAsteroidBelt();
        }

        // Particles update
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function shipDestroyed() {
        createExplosion(ship.x, ship.y, '#ff007f', 30);
        if (window.arcadeAudio) window.arcadeAudio.explosion();
        lives--;
        livesVal.textContent = lives;

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
            ship.x = canvas.width / 2;
            ship.y = canvas.height / 2;
            ship.thrust = { x: 0, y: 0 };
            ship.a = -Math.PI / 2;
            invulnerableTimer = 2.5;
        }
    }

    function draw() {
        ctx.fillStyle = '#03050c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Stars
        for (let s of stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }

        // Draw Asteroids
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;
        for (let a of asteroids) {
            ctx.beginPath();
            for (let j = 0; j < a.vert; j++) {
                const angle = (j / a.vert) * Math.PI * 2;
                const r = a.radius * a.offsets[j];
                const px = a.x + r * Math.cos(angle);
                const py = a.y + r * Math.sin(angle);
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw Ship
        if (lives > 0) {
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.a);

            if (invulnerableTimer <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
                ctx.strokeStyle = '#ffffff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 10;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(ship.r * 1.3, 0);
                ctx.lineTo(-ship.r, ship.r * 0.8);
                ctx.lineTo(-ship.r * 0.5, 0);
                ctx.lineTo(-ship.r, -ship.r * 0.8);
                ctx.closePath();
                ctx.stroke();

                // Thruster flame
                if (ship.thrusting) {
                    ctx.strokeStyle = '#ff9900';
                    ctx.shadowColor = '#ff3300';
                    ctx.beginPath();
                    ctx.moveTo(-ship.r * 0.6, -ship.r * 0.4);
                    ctx.lineTo(-ship.r * 1.5 - Math.random() * 4, 0);
                    ctx.lineTo(-ship.r * 0.6, ship.r * 0.4);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }

        // Draw Lasers
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        for (let l of lasers) {
            ctx.beginPath();
            ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Particles
        for (let p of particles) {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.fillRect(p.x, p.y, 2, 2);
        }
    }

    let lastTime = performance.now();
    function loop(now) {
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        update(Math.min(dt, 0.1));
        draw();
        requestAnimationFrame(loop);
    }

    function startGame() {
        score = 0;
        lives = 3;
        level = 1;
        ship.x = canvas.width / 2;
        ship.y = canvas.height / 2;
        ship.thrust = { x: 0, y: 0 };
        ship.a = -Math.PI / 2;
        lasers = [];
        particles = [];
        isGameOver = false;
        isRunning = true;
        invulnerableTimer = 2;

        scoreVal.textContent = score;
        livesVal.textContent = lives;
        createAsteroidBelt();
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
            ship.rot = -ROT_SPEED;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            ship.rot = ROT_SPEED;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            ship.thrusting = true;
        } else if (e.key === ' ' ) {
            e.preventDefault();
            shootLaser();
        } else if (e.key === 'Shift' || e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            hyperspace();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
            e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            ship.rot = 0;
        }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            ship.thrusting = false;
        }
    });

    // Mobile buttons
    const btnLeft = document.getElementById('mob-left');
    const btnRight = document.getElementById('mob-right');
    const btnThrust = document.getElementById('mob-thrust');
    const btnFire = document.getElementById('mob-fire');

    if (btnLeft) {
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); ship.rot = -ROT_SPEED; });
        btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); ship.rot = 0; });
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); ship.rot = ROT_SPEED; });
        btnRight.addEventListener('touchend', (e) => { e.preventDefault(); ship.rot = 0; });
        btnThrust.addEventListener('touchstart', (e) => { e.preventDefault(); ship.thrusting = true; });
        btnThrust.addEventListener('touchend', (e) => { e.preventDefault(); ship.thrusting = false; });
        btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); shootLaser(); });
    }

    createAsteroidBelt();
    requestAnimationFrame(loop);
})();
