/* ==========================================================================
   帕帕 · 小南瓜 | 游艺街机阁 — 《合金双雄 · 魂斗先锋》 (Contra Pioneer)
   致敬经典《魂斗罗》：横版卷轴动作射击、8向瞄准、散弹S/激光L/爆破F武器、史诗机甲Boss战
   ========================================================================== */

const ContraGame = (() => {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let isRunning = false;
  let score = 0;
  let cameraX = 0;
  let shakeTime = 0;
  let myRole = 1;

  // 实体池
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let capsules = [];
  let particles = [];
  let floatingTexts = [];

  const keys = {};

  // 玩家对象定义
  const player = {
    x: 100, y: 350, vx: 0, vy: 0,
    w: 32, h: 42,
    isGrounded: false,
    isProne: false,
    aimDir: { x: 1, y: 0 },
    facing: 1, // 1: right, -1: left
    weapon: 'S', // 'N' | 'S' | 'L' | 'F' | 'B'
    hp: 100, maxHp: 100,
    lives: 3,
    invincibleTimer: 0,
    shootCooldown: 0,
    avatar: '🐢',
    name: '帕帕先锋'
  };

  // 地形与平台
  const platforms = [
    { x: 0, y: 440, w: 3200, h: 60, type: 'ground' },
    // 悬浮跳台
    { x: 200, y: 340, w: 160, h: 18, type: 'plat' },
    { x: 420, y: 260, w: 180, h: 18, type: 'plat' },
    { x: 680, y: 350, w: 160, h: 18, type: 'plat' },
    { x: 920, y: 240, w: 200, h: 18, type: 'plat' },
    { x: 1200, y: 320, w: 180, h: 18, type: 'plat' },
    { x: 1450, y: 220, w: 200, h: 18, type: 'plat' },
    { x: 1750, y: 330, w: 220, h: 18, type: 'plat' },
    { x: 2100, y: 250, w: 240, h: 18, type: 'plat' },
    { x: 2450, y: 340, w: 300, h: 18, type: 'plat' },
  ];

  // 关底 Boss 状态
  const boss = {
    x: 2700, y: 180, w: 120, h: 220,
    hp: 800, maxHp: 800,
    alive: true,
    active: false,
    state: 'idle', // 'idle' | 'missile' | 'laser' | 'rage'
    timer: 0,
    missilePods: [
      { ox: 15, oy: 40, hp: 150, alive: true },
      { ox: 15, oy: 140, hp: 150, alive: true }
    ]
  };

  function init(containerEl, mode = 'solo', role = 1) {
    myRole = role;
    score = 0;
    cameraX = 0;
    shakeTime = 0;

    player.x = 100;
    player.y = 350;
    player.vx = 0; player.vy = 0;
    player.hp = 100;
    player.lives = 3;
    player.weapon = 'S'; // 默认开局给爽快的 S 弹散弹枪
    player.invincibleTimer = 60;
    player.avatar = role === 1 ? '🐢' : '🎃';
    player.name = role === 1 ? '帕帕先锋' : '小南瓜特工';

    boss.hp = 800;
    boss.alive = true;
    boss.active = false;
    boss.missilePods.forEach(p => { p.hp = 150; p.alive = true; });

    bullets = [];
    enemyBullets = [];
    enemies = [];
    capsules = [];
    particles = [];
    floatingTexts = [];

    // 生成巡逻敌人与炮台
    spawnMapEnemies();

    containerEl.innerHTML = `
      <div class="arcade-arena-wrapper">
        <div class="arcade-hud-bar">
          <div class="arcade-hud-left">
            <div class="hud-stat-pill p1"><span>❤️ 生命:</span> <b id="contraLives">x3</b></div>
            <div class="hud-stat-pill"><span>🛡️ 护盾:</span> <b id="contraHp">100%</b></div>
            <div class="hud-stat-pill p2"><span>🔫 武器:</span> <b id="contraWeapon">[S] 散弹枪</b></div>
          </div>
          <div class="arcade-hud-center">
            <div class="hud-stat-pill score">第 1 关 · 机械要塞</div>
          </div>
          <div class="arcade-hud-right">
            <div class="hud-stat-pill"><span>🏆 战绩:</span> <b id="contraScore">0</b></div>
            <button class="game-scale-btn reset-btn" id="contraRestartBtn" title="重新战斗" style="pointer-events: auto;">↺</button>
          </div>
        </div>

        <!-- Boss 顶部血条 (进入战斗时显现) -->
        <div class="arcade-boss-hud hidden" id="contraBossHud">
          <div class="arcade-boss-title">
            <span>☬ 关底巨兽 · 【歼灭者·重装机甲】</span>
            <span id="contraBossHpText">800 / 800</span>
          </div>
          <div class="arcade-boss-hp-track">
            <div class="arcade-boss-hp-bar" id="contraBossHpBar" style="width: 100%;"></div>
          </div>
        </div>

        <div class="arcade-canvas-box">
          <canvas id="contraCanvas" width="800" height="500"></canvas>
        </div>

        <div class="arcade-controls-hint">
          <span><kbd>A</kbd><kbd>D</kbd> 移动</span>
          <span>|</span>
          <span><kbd>W</kbd> 向上瞄准 / <kbd>S</kbd> 卧倒避弹 / <kbd>S+K</kbd> 下跳</span>
          <span>|</span>
          <span><kbd>J</kbd> 射击 <kbd>K</kbd> 跳跃</span>
        </div>
      </div>
    `;

    canvas = document.getElementById('contraCanvas');
    ctx = canvas.getContext('2d');

    document.getElementById('contraRestartBtn').onclick = () => init(containerEl, mode, role);

    bindEvents();
    isRunning = true;
    loop();
  }

  function spawnMapEnemies() {
    // 地面巡逻小兵
    [350, 600, 850, 1100, 1350, 1600, 1850, 2100, 2350].forEach(x => {
      enemies.push({
        x: x, y: 390, vx: -1.5, vy: 0,
        w: 28, h: 40, type: 'runner', hp: 20,
        fireTimer: 60 + Math.random() * 60
      });
    });

    // 高台固定回旋炮台
    [450, 950, 1500, 2150].forEach(x => {
      enemies.push({
        x: x, y: 220, vx: 0, vy: 0,
        w: 36, h: 36, type: 'turret', hp: 60,
        fireTimer: 45
      });
    });

    // 飞行道具胶囊 (飞鹰装备箱)
    [500, 1100, 1700, 2300].forEach((x, i) => {
      const types = ['S', 'L', 'F', 'B'];
      capsules.push({
        x: x, y: 150 + Math.sin(i) * 50,
        vx: 1.2, vy: 0.8,
        w: 32, h: 22,
        weapon: types[i % types.length],
        alive: true,
        opened: false
      });
    });
  }

  function bindEvents() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function unbindEvents() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'KeyJ' || e.code === 'KeyZ') {
      shootWeapon();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function loop() {
    if (!isRunning) return;
    update();
    render();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    // 1. 玩家移动与姿态输入
    if (keys['KeyS']) {
      player.isProne = true;
    } else {
      player.isProne = false;
    }

    if (keys['KeyA']) {
      player.vx = -4;
      player.facing = -1;
    } else if (keys['KeyD']) {
      player.vx = 4;
      player.facing = 1;
    } else {
      player.vx *= 0.75;
    }

    // 瞄准方向计算 (8 方向)
    let dx = player.facing;
    let dy = 0;
    if (keys['KeyW']) dy = -1;
    if (keys['KeyS'] && !player.isGrounded) dy = 1;
    if (keys['KeyW'] && !keys['KeyA'] && !keys['KeyD']) dx = 0;
    player.aimDir = { x: dx, y: dy };

    // 跳跃 (按 S + K 下跳平台)
    if (keys['KeyK'] && player.isGrounded) {
      if (keys['KeyS']) {
        player.y += 20; // 穿透平台下落
        player.isGrounded = false;
      } else {
        player.vy = -11.5;
        player.isGrounded = false;
        createDust(player.x + player.w / 2, player.y + player.h);
      }
    }

    // 连发机枪支持 (按住 J 自动连射)
    if (keys['KeyJ'] || keys['KeyZ']) {
      if (player.shootCooldown <= 0) {
        shootWeapon();
      }
    }
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.invincibleTimer > 0) player.invincibleTimer--;

    // 重力与移动
    player.vy += 0.55;
    if (player.vy > 13) player.vy = 13;

    player.x += player.vx;
    player.y += player.vy;
    player.isGrounded = false;

    // 碰撞检测与着地
    platforms.forEach(p => {
      if (
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        player.y + player.h >= p.y &&
        player.y + player.h <= p.y + 20 &&
        player.vy >= 0
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.isGrounded = true;
      }
    });

    // 屏幕卷轴跟随 (Camera follow)
    cameraX = Math.max(cameraX, player.x - 200);
    // 不能往回走
    if (player.x < cameraX) player.x = cameraX;

    // 2. 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // 击中敌人判定
      enemies.forEach(e => {
        if (e.hp > 0 && checkOverlap(b, e)) {
          e.hp -= b.dmg;
          b.life = 0;
          createHitSparks(b.x, b.y);
          if (e.hp <= 0) {
            score += 150;
            createExplosion(e.x + e.w / 2, e.y + e.h / 2);
            addFloatingText(e.x, e.y, '+150', '#fde047');
            updateHUD();
          }
        }
      });

      // 击中飞鹰胶囊
      capsules.forEach(c => {
        if (c.alive && !c.opened && checkOverlap(b, c)) {
          c.opened = true;
          b.life = 0;
          createHitSparks(b.x, b.y);
        }
      });

      // 击中 Boss
      if (boss.active && boss.alive && checkOverlap(b, boss)) {
        boss.hp -= b.dmg;
        b.life = 0;
        createHitSparks(b.x, b.y);
        shakeTime = 3;
        updateBossHud();
        if (boss.hp <= 0) {
          boss.alive = false;
          score += 5000;
          createBigExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2);
          addFloatingText(boss.x + boss.w / 2, boss.y, '🏆 巨像要塞歼灭！', '#fde047');
          setTimeout(handleGameWin, 1500);
        }
      }

      if (b.life <= 0 || b.x > cameraX + 850 || b.x < cameraX - 50) {
        bullets.splice(i, 1);
      }
    }

    // 3. 更新敌人与敌方弹幕
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      if (e.type === 'runner') {
        e.x += e.vx;
        if (e.x < cameraX - 100) e.hp = 0;
      }

      e.fireTimer--;
      if (e.fireTimer <= 0 && e.x < cameraX + 800 && e.x > cameraX) {
        e.fireTimer = 70 + Math.random() * 40;
        const angle = Math.atan2((player.y + 20) - (e.y + 20), (player.x + 16) - (e.x + 16));
        enemyBullets.push({
          x: e.x + 10, y: e.y + 15,
          vx: Math.cos(angle) * 3.5,
          vy: Math.sin(angle) * 3.5,
          w: 8, h: 8
        });
      }
    });

    // 4. 更新敌方子弹与玩家受创判定
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;

      if (player.invincibleTimer <= 0 && checkOverlap(player, eb)) {
        playerHit(25);
        enemyBullets.splice(i, 1);
        continue;
      }

      if (eb.x < cameraX - 50 || eb.x > cameraX + 850 || eb.y > 520) {
        enemyBullets.splice(i, 1);
      }
    }

    // 5. 拾取武器胶囊
    capsules.forEach(c => {
      if (!c.alive) return;
      c.x += c.vx;
      c.y += Math.sin(Date.now() / 300) * 1.2;
      if (c.opened && checkOverlap(player, c)) {
        c.alive = false;
        player.weapon = c.weapon;
        createHitSparks(player.x, player.y);
        addFloatingText(player.x, player.y - 20, `[${c.weapon}] 弹药装填!`, '#38bdf8');
        updateHUD();
      }
    });

    // 6. 激活 Boss 战判定
    if (!boss.active && player.x >= 2400) {
      boss.active = true;
      document.getElementById('contraBossHud')?.classList.remove('hidden');
      addFloatingText(player.x, 200, '⚠️ WARNING: 巨像机甲苏醒！', '#ef4444');
    }

    if (boss.active && boss.alive) {
      boss.timer++;
      // Boss 周期性发动导弹与激光
      if (boss.timer % 90 === 0) {
        // 发射 3 发追踪飞弹
        for (let k = -1; k <= 1; k++) {
          enemyBullets.push({
            x: boss.x - 10, y: boss.y + 60 + k * 40,
            vx: -4.5, vy: k * 1.5,
            w: 12, h: 12, isMissile: true
          });
        }
      }
      if (boss.timer % 160 === 0) {
        // 核心蓄能爆发 5 路大弹幕
        for (let a = -0.4; a <= 0.4; a += 0.2) {
          enemyBullets.push({
            x: boss.x - 20, y: boss.y + 110,
            vx: -5.5 * Math.cos(a), vy: 5.5 * Math.sin(a),
            w: 14, h: 14
          });
        }
      }
    }

    // 震屏衰减
    if (shakeTime > 0) shakeTime--;
    updateParticles();
  }

  function shootWeapon() {
    player.shootCooldown = 10;
    const px = player.x + (player.facing === 1 ? player.w : 0);
    const py = player.isProne ? player.y + 30 : player.y + 16;
    const dir = player.aimDir;

    if (player.weapon === 'N') {
      bullets.push({ x: px, y: py, vx: dir.x * 10, vy: dir.y * 10, w: 8, h: 4, dmg: 18, life: 60, color: '#fde047' });
    } else if (player.weapon === 'S') {
      // 5 路扇形散射 (Classic Contra S-Gun)
      [-0.25, -0.12, 0, 0.12, 0.25].forEach(angleOffset => {
        const baseAngle = Math.atan2(dir.y, dir.x);
        const a = baseAngle + angleOffset;
        bullets.push({
          x: px, y: py,
          vx: Math.cos(a) * 9, vy: Math.sin(a) * 9,
          w: 8, h: 8, dmg: 16, life: 55, color: '#ef4444'
        });
      });
    } else if (player.weapon === 'L') {
      // 穿透极光激光
      bullets.push({ x: px, y: py, vx: dir.x * 16, vy: dir.y * 16, w: 28, h: 6, dmg: 35, life: 40, color: '#38bdf8' });
    } else if (player.weapon === 'F') {
      // 烈焰螺旋弹
      bullets.push({ x: px, y: py, vx: dir.x * 7, vy: dir.y * 7, w: 14, h: 14, dmg: 28, life: 70, color: '#f97316' });
    } else if (player.weapon === 'B') {
      player.invincibleTimer = 180;
      bullets.push({ x: px, y: py, vx: dir.x * 10, vy: dir.y * 10, w: 10, h: 6, dmg: 20, life: 60, color: '#a855f7' });
    }
  }

  function playerHit(dmg) {
    player.hp -= dmg;
    player.invincibleTimer = 50;
    shakeTime = 6;
    createHitSparks(player.x, player.y);

    if (player.hp <= 0) {
      player.lives--;
      player.hp = 100;
      player.weapon = 'S';
      createExplosion(player.x + player.w / 2, player.y + player.h / 2);
      addFloatingText(player.x, player.y - 30, '⚠️ 战术复活！', '#ef4444');

      if (player.lives <= 0) {
        handleGameOver();
      }
    }
    updateHUD();
  }

  function updateHUD() {
    const livesEl = document.getElementById('contraLives');
    const hpEl = document.getElementById('contraHp');
    const weaponEl = document.getElementById('contraWeapon');
    const scoreEl = document.getElementById('contraScore');
    if (livesEl) livesEl.textContent = `x${player.lives}`;
    if (hpEl) hpEl.textContent = `${player.hp}%`;
    if (weaponEl) {
      const names = { N: '[N] 突击步枪', S: '[S] 5向散弹枪', L: '[L] 穿透激光', F: '[F] 烈焰旋涡', B: '[B] 金钟护盾' };
      weaponEl.textContent = names[player.weapon] || '[S] 散弹枪';
    }
    if (scoreEl) scoreEl.textContent = score;
  }

  function updateBossHud() {
    const bar = document.getElementById('contraBossHpBar');
    const txt = document.getElementById('contraBossHpText');
    if (bar) bar.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    if (txt) txt.textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp}`;
  }

  function checkOverlap(a, b) {
    return (
      a.x < b.x + (b.w || 8) &&
      a.x + (a.w || 8) > b.x &&
      a.y < b.y + (b.h || 8) &&
      a.y + (a.h || 8) > b.y
    );
  }

  // -------------------------------------------------------------------------
  // 渲染层 (Canvas 60FPS Render)
  // -------------------------------------------------------------------------
  function render() {
    if (!ctx) return;

    ctx.save();
    if (shakeTime > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }

    // 1. 远景机械要塞背景
    const grad = ctx.createLinearGradient(0, 0, 0, 500);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // 绘制卷轴背景山脉与赛博管线
    ctx.save();
    ctx.translate(-cameraX * 0.3, 0);
    ctx.fillStyle = '#1e293b';
    for (let bx = 0; bx < 3500; bx += 300) {
      ctx.fillRect(bx, 200, 180, 240);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.strokeRect(bx, 200, 180, 240);
    }
    ctx.restore();

    // 2. 世界摄像机平移
    ctx.save();
    ctx.translate(-cameraX, 0);

    // 绘制跳台与地面
    platforms.forEach(p => {
      ctx.fillStyle = p.type === 'ground' ? '#334155' : '#475569';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // 绘制飞鹰装备箱
    capsules.forEach(c => {
      if (!c.alive) return;
      ctx.save();
      ctx.fillStyle = c.opened ? '#f59e0b' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, c.w, c.h, [6]);
      ctx.fill();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(c.weapon, c.x + c.w / 2, c.y + 16);
      ctx.restore();
    });

    // 绘制小兵与炮台
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      ctx.save();
      if (e.type === 'runner') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.font = '16px sans-serif';
        ctx.fillText('👾', e.x + 4, e.y + 24);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.fillText('📡', e.x + 8, e.y + 24);
      }
      ctx.restore();
    });

    // 绘制关底 Boss
    if (boss.active && boss.alive) {
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(boss.x, boss.y, boss.w, boss.h);

      // Boss 核心发光眼
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(boss.x + 30, boss.y + 110, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '32px sans-serif';
      ctx.fillText('☬', boss.x + 15, boss.y + 122);
      ctx.restore();
    }

    // 绘制玩家子弹
    bullets.forEach(b => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 绘制敌方子弹
    enemyBullets.forEach(eb => {
      ctx.save();
      ctx.fillStyle = '#f87171';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 绘制主角
    if (player.invincibleTimer % 4 < 2) {
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      const ph = player.isProne ? player.h / 2 : player.h;
      const py = player.isProne ? player.y + player.h / 2 : player.y;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(player.x, py, player.w, ph);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, py, player.w, ph);

      ctx.font = player.isProne ? '14px sans-serif' : '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.avatar, player.x + player.w / 2, py + ph / 2 + 6);
      ctx.restore();
    }

    renderParticles();
    ctx.restore();

    ctx.restore();
  }

  function createHitSparks(x, y) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 14,
        color: '#fde047',
        size: 2.5
      });
    }
  }

  function createDust(x, y) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2,
        life: 15,
        color: '#94a3b8',
        size: 3
      });
    }
  }

  function createExplosion(x, y) {
    shakeTime = 4;
    for (let i = 0; i < 18; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 25,
        color: ['#f59e0b', '#ef4444', '#fde047'][Math.floor(Math.random() * 3)],
        size: 4 + Math.random() * 4
      });
    }
  }

  function createBigExplosion(x, y) {
    shakeTime = 15;
    for (let i = 0; i < 45; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 40,
        color: ['#f59e0b', '#ef4444', '#ffffff', '#38bdf8'][Math.floor(Math.random() * 4)],
        size: 6 + Math.random() * 6
      });
    }
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 50 });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.6;
      ft.life--;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  function renderParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  function handleGameWin() {
    stop();
    if (typeof GamesArena !== 'undefined' && typeof GamesArena.handleGameOver === 'function') {
      GamesArena.handleGameOver(myRole, `魂斗双雄凯旋！歼灭巨像要塞，斩获战功 ${score}！`);
    }
  }

  function handleGameOver() {
    stop();
    if (typeof GamesArena !== 'undefined' && typeof GamesArena.handleGameOver === 'function') {
      GamesArena.handleGameOver(myRole === 1 ? 2 : 1, '战线失守，胜败乃兵家常事，整顿装备再战！');
    }
  }

  function stop() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    unbindEvents();
  }

  return {
    init,
    stop
  };
})();
