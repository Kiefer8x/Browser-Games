// Conan: Hyborian Slayer — Retro Hack & Slash Platformer Engine
(() => {
    const canvas = document.getElementById('conan-canvas');
    const ctx = canvas.getContext('2d');
    const hpFill = document.getElementById('hp-fill');
    const rageFill = document.getElementById('rage-fill');
    const scoreVal = document.getElementById('score-val');
    const overlay = document.getElementById('overlay-screen');
    const overlayTitle = document.getElementById('overlay-title');
    const overlaySubtitle = document.getElementById('overlay-subtitle');
    const startBtn = document.getElementById('start-btn');

    canvas.width = 720;
    canvas.height = 400;

    const GRAVITY = 0.55;
    const WORLD_WIDTH = 2800;

    // Game State
    let cameraX = 0;
    let score = 0;
    let isRunning = false;
    let isGameOver = false;

    // Conan Character
    let conan = {
        x: 80,
        y: 280,
        vx: 0,
        vy: 0,
        width: 36,
        height: 52,
        speed: 4.2,
        facing: 1, // 1: right, -1: left
        onGround: false,
        hp: 100,
        maxHp: 100,
        rage: 0,
        maxRage: 100,
        isAttacking: false,
        attackTimer: 0,
        attackType: 1, // 1: slash, 2: heavy, 3: whirlwind
        invulnTimer: 0
    };

    // Level Platforms
    const platforms = [
        // Ground floor
        { x: 0, y: 350, w: 900, h: 50 },
        { x: 980, y: 350, w: 700, h: 50 },
        { x: 1760, y: 350, w: 1040, h: 50 },

        // Raised ruins & platforms
        { x: 260, y: 270, w: 140, h: 18 },
        { x: 480, y: 220, w: 160, h: 18 },
        { x: 740, y: 260, w: 130, h: 18 },

        { x: 1100, y: 270, w: 150, h: 18 },
        { x: 1340, y: 210, w: 180, h: 18 },
        { x: 1600, y: 260, w: 120, h: 18 },

        { x: 1950, y: 260, w: 160, h: 18 },
        { x: 2200, y: 200, w: 200, h: 18 }
    ];

    let enemies = [];
    let particles = [];
    let bloodDrops = [];
    let damageNumbers = [];
    let items = [];

    const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, a: false, d: false, w: false, attack: false, berserk: false };

    function initLevel() {
        conan.x = 80;
        conan.y = 280;
        conan.vx = 0;
        conan.vy = 0;
        conan.hp = 100;
        conan.rage = 0;
        conan.invulnTimer = 0;
        score = 0;
        scoreVal.textContent = score;
        updateBars();

        // Spawn Enemies
        enemies = [
            // Skeletons
            { type: 'skeleton', x: 340, y: 300, vx: -1, hp: 35, maxHp: 35, w: 32, h: 48, facing: -1, attackCooldown: 0 },
            { type: 'skeleton', x: 540, y: 170, vx: 1, hp: 35, maxHp: 35, w: 32, h: 48, facing: 1, attackCooldown: 0 },
            { type: 'skeleton', x: 780, y: 300, vx: -1, hp: 35, maxHp: 35, w: 32, h: 48, facing: -1, attackCooldown: 0 },
            { type: 'serpent', x: 1180, y: 300, vx: 1.5, hp: 45, maxHp: 45, w: 36, h: 48, facing: 1, attackCooldown: 0 },
            { type: 'skeleton', x: 1400, y: 160, vx: -1, hp: 35, maxHp: 35, w: 32, h: 48, facing: -1, attackCooldown: 0 },
            { type: 'serpent', x: 1850, y: 300, vx: -1.5, hp: 45, maxHp: 45, w: 36, h: 48, facing: -1, attackCooldown: 0 },
            { type: 'skeleton', x: 2020, y: 210, vx: 1, hp: 35, maxHp: 35, w: 32, h: 48, facing: 1, attackCooldown: 0 },

            // Final Boss: Stygian Warlord
            { type: 'warlord', x: 2500, y: 280, vx: 0, hp: 200, maxHp: 200, w: 46, h: 64, facing: -1, attackCooldown: 0, isBoss: true }
        ];

        // Items (Rubies & Health Meat)
        items = [
            { type: 'ruby', x: 300, y: 240, w: 16, h: 16, collected: false },
            { type: 'meat', x: 550, y: 190, w: 20, h: 20, collected: false },
            { type: 'ruby', x: 800, y: 230, w: 16, h: 16, collected: false },
            { type: 'meat', x: 1420, y: 180, w: 20, h: 20, collected: false },
            { type: 'ruby', x: 1650, y: 230, w: 16, h: 16, collected: false },
            { type: 'ruby', x: 2280, y: 170, w: 16, h: 16, collected: false }
        ];

        particles = [];
        bloodDrops = [];
        damageNumbers = [];
    }

    function updateBars() {
        hpFill.style.width = `${Math.max(0, (conan.hp / conan.maxHp) * 100)}%`;
        rageFill.style.width = `${Math.max(0, (conan.rage / conan.maxRage) * 100)}%`;
    }

    function spawnBlood(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            bloodDrops.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 1) * 5,
                r: Math.random() * 3 + 1.5,
                alpha: 1
            });
        }
    }

    function spawnDamageNum(x, y, txt, color = '#ffdd00') {
        damageNumbers.push({ x, y, txt, color, alpha: 1, vy: -1.5 });
    }

    function attack() {
        if (conan.isAttacking) return;
        conan.isAttacking = true;
        conan.attackTimer = 16; // frames
        conan.attackType = Math.random() < 0.5 ? 1 : 2;

        if (window.arcadeAudio) window.arcadeAudio.playTone(180, 'sawtooth', 0.08, 0.2);

        // Attack Hitbox check
        const hitX = conan.facing === 1 ? conan.x + conan.width : conan.x - 45;
        const hitY = conan.y + 10;
        const hitW = 45;
        const hitH = 40;

        let hitAny = false;
        enemies.forEach(e => {
            if (e.hp <= 0) return;
            if (hitX < e.x + e.w && hitX + hitW > e.x &&
                hitY < e.y + e.h && hitY + hitH > e.y) {
                
                const dmg = Math.floor(Math.random() * 12 + 20);
                e.hp -= dmg;
                e.vx = conan.facing * 3; // knockback
                hitAny = true;

                spawnBlood(e.x + e.w / 2, e.y + e.h / 2, 14);
                spawnDamageNum(e.x + e.w / 2, e.y - 10, dmg);

                conan.rage = Math.min(conan.maxRage, conan.rage + 18);
                score += dmg * 2;
                scoreVal.textContent = score;

                if (e.hp <= 0) {
                    spawnBlood(e.x + e.w / 2, e.y + e.h / 2, 30);
                    score += e.isBoss ? 2000 : 250;
                    scoreVal.textContent = score;
                    if (window.arcadeAudio) window.arcadeAudio.powerup();

                    if (e.isBoss) {
                        triggerVictory();
                    }
                }
            }
        });

        if (hitAny && window.arcadeAudio) window.arcadeAudio.hit();
        updateBars();
    }

    function berserkWhirlwind() {
        if (conan.rage < conan.maxRage || conan.isAttacking) return;
        conan.rage = 0;
        updateBars();
        conan.isAttacking = true;
        conan.attackTimer = 35;
        conan.attackType = 3; // whirlwind

        if (window.arcadeAudio) window.arcadeAudio.powerup();

        // 360 degree devastating damage
        enemies.forEach(e => {
            if (e.hp <= 0) return;
            if (Math.hypot((conan.x + conan.width / 2) - (e.x + e.w / 2), conan.y - e.y) < 110) {
                const dmg = 65;
                e.hp -= dmg;
                spawnBlood(e.x + e.w / 2, e.y + e.h / 2, 25);
                spawnDamageNum(e.x + e.w / 2, e.y - 15, `${dmg} CRIT!`, '#ff0033');
                if (e.hp <= 0 && e.isBoss) triggerVictory();
            }
        });
    }

    function update() {
        if (!isRunning || isGameOver) return;

        // Conan Movement
        if (keys.ArrowLeft || keys.a) {
            conan.vx = -conan.speed;
            conan.facing = -1;
        } else if (keys.ArrowRight || keys.d) {
            conan.vx = conan.speed;
            conan.facing = 1;
        } else {
            conan.vx *= 0.7;
        }

        // Jump
        if ((keys.ArrowUp || keys.w) && conan.onGround) {
            conan.vy = -12.5;
            conan.onGround = false;
            if (window.arcadeAudio) window.arcadeAudio.jump();
        }

        // Apply Gravity
        conan.vy += GRAVITY;
        conan.x += conan.vx;
        conan.y += conan.vy;

        // Platform Collisions for Conan
        conan.onGround = false;
        platforms.forEach(p => {
            if (conan.x + conan.width > p.x && conan.x < p.x + p.w &&
                conan.y + conan.height >= p.y && conan.y + conan.height <= p.y + p.h + conan.vy) {
                if (conan.vy >= 0) {
                    conan.y = p.y - conan.height;
                    conan.vy = 0;
                    conan.onGround = true;
                }
            }
        });

        // Pit death
        if (conan.y > 450) {
            conan.hp = 0;
            triggerGameOver();
            return;
        }

        // Invulnerability countdown
        if (conan.invulnTimer > 0) conan.invulnTimer--;

        // Attack Timer
        if (conan.isAttacking) {
            conan.attackTimer--;
            if (conan.attackTimer <= 0) conan.isAttacking = false;
        }

        // Camera follow
        const targetCamX = conan.x - canvas.width * 0.35;
        cameraX += (targetCamX - cameraX) * 0.1;
        cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));

        // Update Items
        items.forEach(item => {
            if (item.collected) return;
            if (conan.x + conan.width > item.x && conan.x < item.x + item.w &&
                conan.y + conan.height > item.y && conan.y < item.y + item.h) {
                item.collected = true;
                if (item.type === 'ruby') {
                    score += 500;
                    scoreVal.textContent = score;
                    if (window.arcadeAudio) window.arcadeAudio.coin();
                    spawnDamageNum(item.x, item.y, '+500 GEM', '#00f0ff');
                } else if (item.type === 'meat') {
                    conan.hp = Math.min(conan.maxHp, conan.hp + 35);
                    updateBars();
                    if (window.arcadeAudio) window.arcadeAudio.powerup();
                    spawnDamageNum(item.x, item.y, '+35 HP', '#00ff88');
                }
            }
        });

        // Update Enemies
        enemies.forEach(e => {
            if (e.hp <= 0) return;

            // Simple AI patrol and chase
            const distToConan = Math.hypot((e.x + e.w / 2) - (conan.x + conan.width / 2), e.y - conan.y);

            if (distToConan < 240) {
                // Chase
                e.facing = conan.x > e.x ? 1 : -1;
                e.x += e.facing * (e.type === 'warlord' ? 1.8 : 1.4);
            } else {
                e.x += e.vx;
                if (Math.random() < 0.01) e.vx = -e.vx;
            }

            // Enemy Attack on Conan
            if (distToConan < 40 && conan.invulnTimer <= 0) {
                const edmg = e.type === 'warlord' ? 25 : 12;
                conan.hp -= edmg;
                conan.invulnTimer = 35;
                conan.vx = -conan.facing * 4;
                spawnBlood(conan.x + conan.width / 2, conan.y + conan.height / 2, 12);
                spawnDamageNum(conan.x, conan.y - 10, `-${edmg}`, '#ff0033');
                if (window.arcadeAudio) window.arcadeAudio.hit();
                updateBars();

                if (conan.hp <= 0) {
                    triggerGameOver();
                }
            }
        });

        // Update Blood Particles
        for (let i = bloodDrops.length - 1; i >= 0; i--) {
            const b = bloodDrops[i];
            b.x += b.vx;
            b.y += b.vy;
            b.vy += 0.3;
            b.alpha -= 0.02;
            if (b.alpha <= 0) bloodDrops.splice(i, 1);
        }

        // Damage Numbers
        for (let i = damageNumbers.length - 1; i >= 0; i--) {
            const dn = damageNumbers[i];
            dn.y += dn.vy;
            dn.alpha -= 0.025;
            if (dn.alpha <= 0) damageNumbers.splice(i, 1);
        }
    }

    function triggerGameOver() {
        isGameOver = true;
        isRunning = false;
        if (window.arcadeAudio) window.arcadeAudio.gameover();
        overlayTitle.textContent = 'CONAN HAS FALLEN';
        overlayTitle.className = 'overlay-title gameover';
        overlaySubtitle.textContent = `The Hyborian sands claim your bones. Score: ${score}`;
        startBtn.textContent = 'ARISE & SLAY';
        overlay.classList.remove('hidden');
    }

    function triggerVictory() {
        isGameOver = true;
        isRunning = false;
        if (window.arcadeAudio) window.arcadeAudio.powerup();
        overlayTitle.textContent = 'VICTORY OVER STYGIA!';
        overlayTitle.className = 'overlay-title victory';
        overlaySubtitle.textContent = `You have slain the Warlord! Final Score: ${score}`;
        startBtn.textContent = 'PLAY AGAIN';
        overlay.classList.remove('hidden');
    }

    function draw() {
        // Sky & Mountain background
        ctx.fillStyle = '#0a0303';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Crimson Blood Moon
        ctx.save();
        ctx.fillStyle = '#ff2200';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(600 - cameraX * 0.05, 90, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Parallax Mountains
        ctx.fillStyle = '#1a0909';
        ctx.beginPath();
        ctx.moveTo(0, 350);
        for (let x = 0; x <= canvas.width + 100; x += 80) {
            const mountainH = 140 + Math.sin((x + cameraX * 0.2) * 0.02) * 50;
            ctx.lineTo(x, 350 - mountainH);
        }
        ctx.lineTo(canvas.width, 350);
        ctx.fill();

        ctx.save();
        ctx.translate(-cameraX, 0);

        // Draw Platforms / Ancient Ruins
        platforms.forEach(p => {
            // Stone texture block
            ctx.fillStyle = '#261414';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeStyle = '#4a2525';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, p.y, p.w, p.h);

            // Weathered ruin cracks
            ctx.fillStyle = '#160a0a';
            ctx.fillRect(p.x, p.y + 2, p.w, 4);
        });

        // Draw Items
        items.forEach(item => {
            if (item.collected) return;
            if (item.type === 'ruby') {
                ctx.save();
                ctx.fillStyle = '#ff0044';
                ctx.shadowColor = '#ff0044';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(item.x + 8, item.y);
                ctx.lineTo(item.x + 16, item.y + 8);
                ctx.lineTo(item.x + 8, item.y + 16);
                ctx.lineTo(item.x, item.y + 8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (item.type === 'meat') {
                ctx.fillStyle = '#ff8844';
                ctx.beginPath();
                ctx.arc(item.x + 10, item.y + 10, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Enemies
        enemies.forEach(e => {
            if (e.hp <= 0) return;
            ctx.save();

            // Health bar over enemy
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(e.x, e.y - 12, e.w, 5);
            ctx.fillStyle = e.isBoss ? '#ff0033' : '#ffaa00';
            ctx.fillRect(e.x, e.y - 12, (e.hp / e.maxHp) * e.w, 5);

            if (e.type === 'skeleton') {
                // Skeleton Warrior
                ctx.fillStyle = '#d9d0c7';
                ctx.fillRect(e.x + 6, e.y, 20, 20); // skull
                ctx.fillRect(e.x + 10, e.y + 20, 12, 18); // ribs
                ctx.fillRect(e.x + 6, e.y + 38, 8, 10);
                ctx.fillRect(e.x + 18, e.y + 38, 8, 10);
                // Glowing red eyes
                ctx.fillStyle = '#ff0033';
                ctx.fillRect(e.x + 10, e.y + 6, 3, 3);
                ctx.fillRect(e.x + 18, e.y + 6, 3, 3);
                // Rusty blade
                ctx.fillStyle = '#888';
                ctx.fillRect(e.facing === 1 ? e.x + 24 : e.x - 10, e.y + 16, 12, 3);
            } else if (e.type === 'serpent') {
                // Serpent Cultist
                ctx.fillStyle = '#225522';
                ctx.fillRect(e.x + 4, e.y, 24, 22);
                ctx.fillStyle = '#113311';
                ctx.fillRect(e.x + 2, e.y + 22, 28, 26);
                // Spear
                ctx.fillStyle = '#aa8800';
                ctx.fillRect(e.facing === 1 ? e.x + 28 : e.x - 12, e.y + 10, 16, 4);
            } else if (e.type === 'warlord') {
                // Huge Warlord Boss
                ctx.fillStyle = '#441111';
                ctx.fillRect(e.x, e.y, e.w, e.h);
                // Horned helmet
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(e.x + 4, e.y - 8, 8, 10);
                ctx.fillRect(e.x + e.w - 12, e.y - 8, 8, 10);
                // Greatsword
                ctx.fillStyle = '#dddddd';
                ctx.shadowColor = '#ff2200';
                ctx.shadowBlur = 12;
                ctx.fillRect(e.facing === 1 ? e.x + e.w : e.x - 22, e.y + 10, 22, 8);
            }
            ctx.restore();
        });

        // Draw Conan
        if (conan.hp > 0) {
            ctx.save();
            if (conan.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            const cx = conan.x;
            const cy = conan.y;

            // Barbarian Muscular Torso (tanned bronze skin)
            ctx.fillStyle = '#b87333';
            ctx.fillRect(cx + 8, cy + 14, 20, 20);

            // Black Mane / Hair & Face
            ctx.fillStyle = '#111111';
            ctx.fillRect(cx + 6, cy - 2, 24, 16);
            ctx.fillStyle = '#b87333';
            ctx.fillRect(cx + 10, cy + 4, 16, 10); // Face

            // Fur Loincloth & Belt
            ctx.fillStyle = '#5c3a21';
            ctx.fillRect(cx + 6, cy + 32, 24, 10);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(cx + 14, cy + 32, 8, 4); // Buckle

            // Muscular Legs & Leather Boots
            ctx.fillStyle = '#b87333';
            ctx.fillRect(cx + 8, cy + 42, 8, 6);
            ctx.fillRect(cx + 20, cy + 42, 8, 6);
            ctx.fillStyle = '#3a2212';
            ctx.fillRect(cx + 7, cy + 48, 9, 6);
            ctx.fillRect(cx + 19, cy + 48, 9, 6);

            // Broadsword Blade & Attack Arc
            if (conan.isAttacking) {
                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.shadowColor = conan.attackType === 3 ? '#ffaa00' : '#ff4400';
                ctx.shadowBlur = 15;
                ctx.lineWidth = 4;

                if (conan.attackType === 3) {
                    // Whirlwind 360 circle
                    ctx.beginPath();
                    ctx.arc(cx + conan.width / 2, cy + conan.height / 2, 45, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // Forward slashing crescent arc
                    const slashX = conan.facing === 1 ? cx + 24 : cx + 12;
                    ctx.beginPath();
                    ctx.arc(slashX, cy + 22, 34, conan.facing === 1 ? -0.8 : 2.4, conan.facing === 1 ? 0.9 : 4.1);
                    ctx.stroke();
                }
                ctx.restore();
            } else {
                // Holstered / ready sword
                ctx.fillStyle = '#cccccc';
                const sx = conan.facing === 1 ? cx + 24 : cx - 6;
                ctx.fillRect(sx, cy + 18, 16, 4);
            }
            ctx.restore();
        }

        // Draw Blood Drops
        bloodDrops.forEach(b => {
            ctx.fillStyle = `rgba(180, 0, 0, ${b.alpha})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Damage Numbers
        damageNumbers.forEach(dn => {
            ctx.save();
            ctx.fillStyle = dn.color;
            ctx.globalAlpha = dn.alpha;
            ctx.font = 'bold 16px Outfit, sans-serif';
            ctx.fillText(dn.txt, dn.x, dn.y);
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
        initLevel();
        isGameOver = false;
        isRunning = true;
        overlay.classList.add('hidden');
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

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); keys.ArrowUp = true; }
        if (e.key === ' ' || e.key === 'j' || e.key === 'J') { e.preventDefault(); attack(); }
        if (e.key === 'c' || e.key === 'C' || e.key === 'k' || e.key === 'K') { e.preventDefault(); berserkWhirlwind(); }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.ArrowRight = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.ArrowUp = false;
    });

    // Mobile buttons
    const mLeft = document.getElementById('mob-left');
    const mRight = document.getElementById('mob-right');
    const mJump = document.getElementById('mob-jump');
    const mAttack = document.getElementById('mob-attack');

    if (mLeft) {
        mLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
        mLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
        mRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
        mRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });
        mJump.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowUp = true; });
        mJump.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowUp = false; });
        mAttack.addEventListener('touchstart', (e) => { e.preventDefault(); attack(); });
    }

    initLevel();
    requestAnimationFrame(loop);
})();
