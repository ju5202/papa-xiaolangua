/* ==========================================================================
   帕帕 · 小南瓜 | 游艺街机阁 — 《星际雷霆 · 极光战机》 (Thunder Striker)
   致敬经典《雷霆战机》：纵版飞行弹幕射击 (STG)、主炮进阶暴走、双僚机浮游炮、全屏歼星大招
   ========================================================================== */

const ThunderGame = (() => {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let isRunning = false;
  let score = 0;
  let myRole = 1;
  let shakeTime = 0;

  // 实体池
  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let powerups = [];
  let stars = [];
  let particles = [];
  let floatingTexts = [];

  const keys = {};
  let mousePos = { x: 400, y: 400, active: false };

  // 玩家战机
  const fighter = {
    x: 400, y: 400,
    w: 36, h: 42,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    powerLevel: 1, // 1 ~ 4 (Lv.4 为暴走狂暴模式)
    frenzyTimer: 0,
    bombs: 2,
    hasShield: false,
    shieldHp: 0,
    shootTimer: 0,
    avatar: '🐢',
    name: '极光神龟号'
  };

  // 终极星际母舰 Boss
  const boss = {
    x: 400, y: -100, targetY: 100,
    w: 160, h: 100,
    hp: 1200, maxHp: 1200,
    alive: false,
    active: false,
    timer: 0,
    phase: 1
  };

  let waveTimer = 0;
  let currentWave = 1;

  function init(containerEl, mode = 'solo', role = 1) {
    myRole = role;
    score = 0;
    shakeTime = 0;
    waveTimer = 0;
    currentWave = 1;

    fighter.x = 400;
    fighter.y = 400;
    fighter.hp = 100;
    fighter.powerLevel = 1;
    fighter.frenzyTimer = 0;
    fighter.bombs = 2;
    fighter.hasShield = false;
    fighter.avatar = role === 1 ? '🐢' : '🎃';
    fighter.name = role === 1 ? '极光神龟号' : '炽焰战梭';

    boss.hp = 1200;
    boss.alive = false;
    boss.active = false;
    boss.y = -100;
    boss.timer = 0;
    boss.phase = 1;

    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerups = [];
    particles = [];
    floatingTexts = [];

    // 初始化星空背景粒子
    initStars();

    containerEl.innerHTML = `
      <div class="arcade-arena-wrapper">
        <div class="arcade-hud-bar">
          <div class="arcade-hud-left">
            <div class="hud-stat-pill p1"><span>🛡️ 装甲:</span> <b id="thunderHp">100%</b></div>
            <div class="hud-stat-pill p2"><span>⚡ 主炮:</span> <b id="thunderPower">Lv.1</b></div>
            <div class="hud-stat-pill score"><span>💣 歼星大招:</span> <b id="thunderBombs">x2</b></div>
          </div>
          <div class="arcade-hud-center">
            <div class="hud-stat-pill score" id="thunderWaveTitle">第 1 波 · 先锋编队</div>
          </div>
          <div class="arcade-hud-right">
            <div class="hud-stat-pill"><span>🏆 积分:</span> <b id="thunderScore">0</b></div>
            <button class="game-scale-btn reset-btn" id="thunderRestartBtn" title="重新出击" style="pointer-events: auto;">↺</button>
          </div>
        </div>

        <!-- Boss 顶部血条 -->
        <div class="arcade-boss-hud hidden" id="thunderBossHud">
          <div class="arcade-boss-title">
            <span>☬ 星核母舰 · 【混沌利维坦】</span>
            <span id="thunderBossHpText">1200 / 1200</span>
          </div>
          <div class="arcade-boss-hp-track">
            <div class="arcade-boss-hp-bar" id="thunderBossHpBar" style="width: 100%;"></div>
          </div>
        </div>

        <div class="arcade-canvas-box">
          <canvas id="thunderCanvas" width="800" height="500"></canvas>
        </div>

        <div class="arcade-controls-hint">
          <span>鼠标跟随 / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</span>
          <span>|</span>
          <span>自动极速开火</span>
          <span>|</span>
          <span>按 <kbd>Space</kbd> 释放全屏歼星核弹</span>
        </div>

        <!-- 触控大招按钮 -->
        <div class="arcade-touch-bar">
          <div></div>
          <div class="touch-btn-cluster">
            <button class="arcade-touch-btn bomb" id="thunderBombTouchBtn" title="释放全屏必杀大招">💣</button>
          </div>
        </div>
      </div>
    `;

    canvas = document.getElementById('thunderCanvas');
    ctx = canvas.getContext('2d');

    document.getElementById('thunderRestartBtn').onclick = () => init(containerEl, mode, role);
    document.getElementById('thunderBombTouchBtn').onclick = triggerScreenBomb;

    bindEvents();
    isRunning = true;
    loop();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 500,
        speed: 1 + Math.random() * 3.5,
        size: 1 + Math.random() * 2,
        color: ['#ffffff', '#38bdf8', '#fde047', '#a855f7'][Math.floor(Math.random() * 4)]
      });
    }
  }

  function bindEvents() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    if (canvas) {
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', () => { mousePos.active = false; });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    }
  }

  function unbindEvents() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      triggerScreenBomb();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.clientX - rect.left) * scaleX;
    mousePos.y = (e.clientY - rect.top) * scaleY;
    mousePos.active = true;
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos.x = (e.touches[0].clientX - rect.left) * scaleX;
      mousePos.y = (e.touches[0].clientY - rect.top) * scaleY;
      mousePos.active = true;
    }
  }

  function loop() {
    if (!isRunning) return;
    update();
    render();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    // 1. 战机移动控制 (支持鼠标跟随或 WASD)
    if (mousePos.active) {
      fighter.x += (mousePos.x - fighter.x) * 0.18;
      fighter.y += (mousePos.y - fighter.y) * 0.18;
    } else {
      if (keys['KeyA'] || keys['ArrowLeft']) fighter.x -= 6;
      if (keys['KeyD'] || keys['ArrowRight']) fighter.x += 6;
      if (keys['KeyW'] || keys['ArrowUp']) fighter.y -= 6;
      if (keys['KeyS'] || keys['ArrowDown']) fighter.y += 6;
    }

    fighter.x = Math.max(30, Math.min(770, fighter.x));
    fighter.y = Math.max(40, Math.min(460, fighter.y));

    // 2. 自动高速开火
    fighter.shootTimer++;
    const fireInterval = fighter.powerLevel === 4 ? 4 : 7;
    if (fighter.shootTimer % fireInterval === 0) {
      fireMainCannon();
    }

    if (fighter.frenzyTimer > 0) {
      fighter.frenzyTimer--;
      if (fighter.frenzyTimer === 0 && fighter.powerLevel === 4) {
        fighter.powerLevel = 3;
        updateHUD();
      }
    }

    // 3. 敌人波次生成
    waveTimer++;
    if (!boss.active) {
      if (waveTimer % 45 === 0) {
        // 生成轻型无人侦察机
        const count = 3 + Math.floor(Math.random() * 3);
        const startX = 100 + Math.random() * 600;
        for (let i = 0; i < count; i++) {
          enemies.push({
            x: startX + (i - count / 2) * 45,
            y: -20 - i * 30,
            vx: Math.sin(waveTimer / 30) * 2,
            vy: 2.8,
            w: 26, h: 26,
            hp: 20, maxHp: 20,
            type: 'drone',
            fireCooldown: 40 + Math.random() * 40
          });
        }
      }

      if (waveTimer % 180 === 0) {
        // 生成重型装甲巡洋舰
        enemies.push({
          x: 150 + Math.random() * 500,
          y: -50,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1.2,
          w: 60, h: 50,
          hp: 140, maxHp: 140,
          type: 'cruiser',
          fireCooldown: 30
        });
      }

      // 波次晋级到 Boss 战 (第 500 帧后 Boss 降临)
      if (waveTimer > 550 && !boss.active) {
        boss.active = true;
        boss.alive = true;
        document.getElementById('thunderBossHud')?.classList.remove('hidden');
        document.getElementById('thunderWaveTitle').textContent = '⚠️ BOSS 战 · 混沌利维坦';
        addFloatingText(400, 200, '⚠️ WARNING: 巨型星际母舰来袭！', '#ef4444');
      }
    }

    // 4. Boss 行为逻辑
    if (boss.active && boss.alive) {
      if (boss.y < boss.targetY) {
        boss.y += 1.5;
      } else {
        boss.x = 400 + Math.sin(boss.timer / 40) * 180;
      }
      boss.timer++;

      // Boss 弹幕发射模式
      if (boss.timer % 50 === 0) {
        // 8 方向螺旋散射
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const rotAngle = a + (boss.timer / 25);
          enemyBullets.push({
            x: boss.x, y: boss.y + 40,
            vx: Math.cos(rotAngle) * 3.8,
            vy: Math.sin(rotAngle) * 3.8,
            size: 6, color: '#f87171'
          });
        }
      }

      if (boss.timer % 120 === 0) {
        // 扇形高能爆破弹
        for (let k = -2; k <= 2; k++) {
          enemyBullets.push({
            x: boss.x + k * 20, y: boss.y + 50,
            vx: k * 1.4, vy: 4.8,
            size: 10, color: '#f59e0b'
          });
        }
      }
    }

    // 5. 更新玩家子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      // 命中杂兵
      enemies.forEach(e => {
        if (e.hp > 0 && checkOverlap(b, e)) {
          e.hp -= b.dmg;
          b.life = 0;
          createSparks(b.x, b.y, b.color);
          if (e.hp <= 0) {
            score += e.type === 'cruiser' ? 300 : 100;
            createExplosion(e.x + e.w / 2, e.y + e.h / 2, 14);
            // 几率掉落能量水晶或升级包
            if (Math.random() < 0.35) {
              powerups.push({
                x: e.x + e.w / 2, y: e.y + e.h / 2,
                vy: 1.8,
                type: Math.random() < 0.6 ? 'power' : 'shield'
              });
            }
            updateHUD();
          }
        }
      });

      // 命中 Boss
      if (boss.active && boss.alive && checkOverlap(b, boss)) {
        boss.hp -= b.dmg;
        b.life = 0;
        createSparks(b.x, b.y, b.color);
        updateBossHud();
        if (boss.hp <= 0) {
          boss.alive = false;
          score += 10000;
          createMegaExplosion(boss.x, boss.y + 40);
          addFloatingText(400, 200, '🏆 星核母舰歼灭！星系解放！', '#fde047');
          setTimeout(handleGameWin, 2000);
        }
      }

      if (b.life <= 0 || b.y < -20 || b.x < -20 || b.x > 820) {
        bullets.splice(i, 1);
      }
    }

    // 6. 更新敌人与敌方发射
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.vx;
      e.y += e.vy;

      e.fireCooldown--;
      if (e.fireCooldown <= 0 && e.y > 0 && e.y < 450) {
        e.fireCooldown = 60 + Math.random() * 50;
        enemyBullets.push({
          x: e.x + e.w / 2, y: e.y + e.h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3.5,
          size: 6, color: '#ef4444'
        });
      }

      // 与战机碰撞
      if (checkOverlap(e, fighter)) {
        hitFighter(30);
        e.hp = 0;
        createExplosion(e.x, e.y, 10);
      }

      if (e.hp <= 0 || e.y > 550) {
        enemies.splice(i, 1);
      }
    }

    // 7. 更新敌方弹幕
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;

      if (checkOverlap(eb, fighter)) {
        hitFighter(15);
        enemyBullets.splice(i, 1);
        continue;
      }

      if (eb.y > 520 || eb.y < -20 || eb.x < -20 || eb.x > 820) {
        enemyBullets.splice(i, 1);
      }
    }

    // 8. 拾取掉落道具
    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      pu.y += pu.vy;
      if (checkOverlap(pu, fighter)) {
        if (pu.type === 'power') {
          fighter.powerLevel = Math.min(4, fighter.powerLevel + 1);
          if (fighter.powerLevel === 4) fighter.frenzyTimer = 300; // 5秒暴走
          addFloatingText(fighter.x, fighter.y - 20, fighter.powerLevel === 4 ? '⚡ 暴走狂暴模式！' : '⚡ 武器升级！', '#fde047');
        } else {
          fighter.hasShield = true;
          fighter.shieldHp = 60;
          addFloatingText(fighter.x, fighter.y - 20, '🛡️ 能量护盾生成！', '#38bdf8');
        }
        score += 200;
        updateHUD();
        powerups.splice(i, 1);
        continue;
      }
      if (pu.y > 520) powerups.splice(i, 1);
    }

    // 星空卷轴下移
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > 500) { s.y = 0; s.x = Math.random() * 800; }
    });

    if (shakeTime > 0) shakeTime--;
    updateParticles();
  }

  function fireMainCannon() {
    const fx = fighter.x;
    const fy = fighter.y - 14;

    if (fighter.powerLevel === 1) {
      bullets.push({ x: fx - 8, y: fy, vx: 0, vy: -12, dmg: 22, color: '#38bdf8', w: 6, h: 16 });
      bullets.push({ x: fx + 8, y: fy, vx: 0, vy: -12, dmg: 22, color: '#38bdf8', w: 6, h: 16 });
    } else if (fighter.powerLevel === 2) {
      bullets.push({ x: fx - 14, y: fy, vx: -1.2, vy: -12, dmg: 25, color: '#38bdf8', w: 7, h: 18 });
      bullets.push({ x: fx, y: fy - 4, vx: 0, vy: -13, dmg: 30, color: '#fde047', w: 8, h: 20 });
      bullets.push({ x: fx + 14, y: fy, vx: 1.2, vy: -12, dmg: 25, color: '#38bdf8', w: 7, h: 18 });
    } else if (fighter.powerLevel === 3) {
      // 四路高能等离子束 + 双僚机追踪
      bullets.push({ x: fx - 18, y: fy, vx: -2, vy: -12, dmg: 28, color: '#38bdf8', w: 8, h: 20 });
      bullets.push({ x: fx - 6, y: fy, vx: 0, vy: -14, dmg: 32, color: '#fde047', w: 8, h: 22 });
      bullets.push({ x: fx + 6, y: fy, vx: 0, vy: -14, dmg: 32, color: '#fde047', w: 8, h: 22 });
      bullets.push({ x: fx + 18, y: fy, vx: 2, vy: -12, dmg: 28, color: '#38bdf8', w: 8, h: 20 });
    } else if (fighter.powerLevel === 4) {
      // 暴走狂暴模式 (Frenzy Mode)
      for (let k = -3; k <= 3; k++) {
        bullets.push({
          x: fx + k * 10, y: fy - Math.abs(k) * 4,
          vx: k * 1.2, vy: -16,
          dmg: 45, color: '#f43f5e', w: 10, h: 28
        });
      }
    }
  }

  function triggerScreenBomb() {
    if (fighter.bombs <= 0) return;
    fighter.bombs--;
    shakeTime = 20;

    // 清屏敌方全部子弹并对全屏敌人造成巨额伤害
    enemyBullets = [];
    enemies.forEach(e => {
      e.hp -= 300;
      createExplosion(e.x + e.w / 2, e.y + e.h / 2, 16);
    });

    if (boss.active && boss.alive) {
      boss.hp -= 250;
      updateBossHud();
    }

    addFloatingText(400, 250, '💥 歼星聚能天罚爆发！', '#fde047');
    updateHUD();
  }

  function hitFighter(dmg) {
    if (fighter.hasShield) {
      fighter.shieldHp -= dmg;
      createSparks(fighter.x, fighter.y, '#38bdf8');
      if (fighter.shieldHp <= 0) fighter.hasShield = false;
      return;
    }

    fighter.hp -= dmg;
    shakeTime = 8;
    createSparks(fighter.x, fighter.y, '#ef4444');
    if (fighter.hp <= 0) {
      handleGameOver();
    }
    updateHUD();
  }

  function updateHUD() {
    const hpEl = document.getElementById('thunderHp');
    const powerEl = document.getElementById('thunderPower');
    const bombsEl = document.getElementById('thunderBombs');
    const scoreEl = document.getElementById('thunderScore');
    if (hpEl) hpEl.textContent = `${Math.max(0, fighter.hp)}%`;
    if (powerEl) powerEl.textContent = fighter.powerLevel === 4 ? 'Lv.MAX 暴走' : `Lv.${fighter.powerLevel}`;
    if (bombsEl) bombsEl.textContent = `x${fighter.bombs}`;
    if (scoreEl) scoreEl.textContent = score;
  }

  function updateBossHud() {
    const bar = document.getElementById('thunderBossHpBar');
    const txt = document.getElementById('thunderBossHpText');
    if (bar) bar.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    if (txt) txt.textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp}`;
  }

  function checkOverlap(a, b) {
    const aw = a.w || a.size || 10;
    const ah = a.h || a.size || 10;
    const bw = b.w || b.size || 10;
    const bh = b.h || b.size || 10;
    return (
      a.x < b.x + bw &&
      a.x + aw > b.x &&
      a.y < b.y + bh &&
      a.y + ah > b.y
    );
  }

  // -------------------------------------------------------------------------
  // 渲染层 (Canvas 60FPS Render)
  // -------------------------------------------------------------------------
  function render() {
    if (!ctx) return;

    ctx.save();
    if (shakeTime > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    // 1. 深邃星际背景
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, 800, 500);

    // 绘制穿梭星光
    stars.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.speed * 2.5);
    });

    // 2. 绘制掉落道具包
    powerups.forEach(pu => {
      ctx.save();
      ctx.fillStyle = pu.type === 'power' ? '#fde047' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pu.type === 'power' ? '⚡' : '🛡️', pu.x, pu.y + 4);
      ctx.restore();
    });

    // 3. 绘制敌人编队
    enemies.forEach(e => {
      ctx.save();
      if (e.type === 'drone') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(e.x + e.w / 2, e.y + e.h);
        ctx.lineTo(e.x, e.y);
        ctx.lineTo(e.x + e.w, e.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.stroke();
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(e.x, e.y, e.w, e.h);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛸', e.x + e.w / 2, e.y + e.h / 2 + 7);
      }
      ctx.restore();
    });

    // 4. 绘制星核母舰 Boss
    if (boss.active && boss.alive) {
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.fillRect(boss.x - boss.w / 2, boss.y, boss.w, boss.h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(boss.x - boss.w / 2, boss.y, boss.w, boss.h);

      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☬', boss.x, boss.y + 65);
      ctx.restore();
    }

    // 5. 绘制玩家弹幕
    bullets.forEach(b => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      ctx.restore();
    });

    // 6. 绘制敌方弹幕
    enemyBullets.forEach(eb => {
      ctx.save();
      ctx.fillStyle = eb.color;
      ctx.shadowColor = eb.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. 绘制玩家战机
    ctx.save();
    ctx.shadowColor = fighter.powerLevel === 4 ? '#f43f5e' : '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.fillStyle = fighter.powerLevel === 4 ? '#f43f5e' : '#0284c7';

    // 战机三角翼形
    ctx.beginPath();
    ctx.moveTo(fighter.x, fighter.y - 20);
    ctx.lineTo(fighter.x + 18, fighter.y + 16);
    ctx.lineTo(fighter.x - 18, fighter.y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 战机座舱
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fighter.avatar, fighter.x, fighter.y + 6);

    // 能量护盾光晕
    if (fighter.hasShield) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fighter.x, fighter.y, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    renderParticles();
    ctx.restore();
  }

  function createSparks(x, y, color) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 12,
        color: color || '#fde047',
        size: 2.5
      });
    }
  }

  function createExplosion(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 20,
        color: ['#f59e0b', '#ef4444', '#fde047'][Math.floor(Math.random() * 3)],
        size: 3 + Math.random() * 4
      });
    }
  }

  function createMegaExplosion(x, y) {
    shakeTime = 25;
    for (let i = 0; i < 60; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        life: 45,
        color: ['#38bdf8', '#f59e0b', '#ef4444', '#ffffff'][Math.floor(Math.random() * 4)],
        size: 6 + Math.random() * 8
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
      GamesArena.handleGameOver(myRole, `极光战机凯旋！击破星核母舰混沌利维坦，斩获战果 ${score}！`);
    }
  }

  function handleGameOver() {
    stop();
    if (typeof GamesArena !== 'undefined' && typeof GamesArena.handleGameOver === 'function') {
      GamesArena.handleGameOver(myRole === 1 ? 2 : 1, '战机坠毁，星空未平，随时重整战旗再次出征！');
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
