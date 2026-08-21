/* ==========================================================================
   帕帕 · 小南瓜 | 游艺街机阁 — 《水火共生 · 灵泉圣殿》 (Water & Fire Temple)
   致敬经典《森林冰火人》：双人解谜跳台闯关，水火相生相克，机关协作解密
   ========================================================================== */

const TempleGame = (() => {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let isRunning = false;
  let currentLevelIdx = 0;
  let score = 0;
  let isCoopPvp = false;
  let myRole = 1; // 1: 帕帕 (水灵龟) | 2: 小南瓜 (炽焰南瓜)

  // 粒子系统
  let particles = [];
  let floatingTexts = [];

  // 按键状态
  const keys = {};

  // 玩家对象定义
  const p1 = {
    x: 60, y: 380, vx: 0, vy: 0,
    w: 26, h: 26,
    isGrounded: false,
    alive: true,
    type: 'water',
    name: '帕帕',
    avatar: '🐢',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.6)',
    diamonds: 0,
    inDoor: false
  };

  const p2 = {
    x: 100, y: 380, vx: 0, vy: 0,
    w: 26, h: 26,
    isGrounded: false,
    alive: true,
    type: 'fire',
    name: '小南瓜',
    avatar: '🎃',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.6)',
    diamonds: 0,
    inDoor: false
  };

  // 关卡设计 (4大精心设计的机关谜题关卡)
  const LEVELS = [
    // 关卡 1: 初入神殿 (基础水火池 + 压力板开门)
    {
      name: '第 1 关 · 初入神殿',
      p1Start: { x: 50, y: 400 },
      p2Start: { x: 90, y: 400 },
      platforms: [
        { x: 0, y: 450, w: 800, h: 50, type: 'stone' }, // 地面
        { x: 0, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 770, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 0, y: 0, w: 800, h: 30, type: 'wall' },

        // 中间平台
        { x: 180, y: 360, w: 140, h: 20, type: 'stone' },
        { x: 480, y: 360, w: 140, h: 20, type: 'stone' },
        { x: 280, y: 260, w: 240, h: 20, type: 'stone' },
        { x: 100, y: 160, w: 200, h: 20, type: 'stone' },
        { x: 500, y: 160, w: 200, h: 20, type: 'stone' },
      ],
      hazards: [
        { x: 200, y: 435, w: 120, h: 18, type: 'water' }, // 水池 (帕帕安全/小南瓜死)
        { x: 480, y: 435, w: 120, h: 18, type: 'fire' },  // 火池 (小南瓜安全/帕帕死)
      ],
      boxes: [
        { x: 380, y: 220, w: 32, h: 32, vx: 0, vy: 0, isGrounded: false }
      ],
      buttons: [
        { id: 'btn1', x: 200, y: 348, w: 30, h: 12, color: '#38bdf8', pressed: false, targetDoor: 'door1' },
        { id: 'btn2', x: 560, y: 348, w: 30, h: 12, color: '#f97316', pressed: false, targetDoor: 'door2' },
      ],
      doors: [
        { id: 'door1', x: 280, y: 180, w: 14, h: 80, open: false, openOffset: 0, color: '#38bdf8' },
        { id: 'door2', x: 500, y: 180, w: 14, h: 80, open: false, openOffset: 0, color: '#f97316' },
      ],
      diamonds: [
        { x: 240, y: 330, type: 'water', collected: false },
        { x: 540, y: 330, type: 'fire', collected: false },
        { x: 380, y: 120, type: 'water', collected: false },
        { x: 420, y: 120, type: 'fire', collected: false },
      ],
      exits: {
        water: { x: 150, y: 100, w: 36, h: 60 },
        fire: { x: 610, y: 100, w: 36, h: 60 }
      }
    },

    // 关卡 2: 水火悬桥 (升降梯与毒沼池)
    {
      name: '第 2 关 · 水火悬桥',
      p1Start: { x: 40, y: 410 },
      p2Start: { x: 40, y: 360 },
      platforms: [
        { x: 0, y: 450, w: 200, h: 50, type: 'stone' },
        { x: 600, y: 450, w: 200, h: 50, type: 'stone' },
        { x: 0, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 770, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 0, y: 0, w: 800, h: 30, type: 'wall' },

        { x: 260, y: 340, w: 120, h: 20, type: 'stone' },
        { x: 420, y: 340, w: 120, h: 20, type: 'stone' },
        { x: 120, y: 220, w: 180, h: 20, type: 'stone' },
        { x: 500, y: 220, w: 180, h: 20, type: 'stone' },
        { x: 320, y: 130, w: 160, h: 20, type: 'stone' },
      ],
      elevators: [
        { id: 'el1', x: 210, y: 440, w: 70, h: 14, startY: 440, targetY: 220, speed: 2, currentY: 440, active: false }
      ],
      hazards: [
        { x: 200, y: 440, w: 180, h: 15, type: 'water' },
        { x: 380, y: 440, w: 80, h: 15, type: 'toxic' }, // 毒沼 (两人皆死)
        { x: 460, y: 440, w: 140, h: 15, type: 'fire' },
      ],
      boxes: [
        { x: 180, y: 180, w: 32, h: 32, vx: 0, vy: 0, isGrounded: false }
      ],
      buttons: [
        { id: 'btn_el', x: 550, y: 208, w: 30, h: 12, color: '#eab308', pressed: false, targetElevator: 'el1' }
      ],
      doors: [],
      diamonds: [
        { x: 280, y: 300, type: 'water', collected: false },
        { x: 460, y: 300, type: 'fire', collected: false },
        { x: 350, y: 90, type: 'water', collected: false },
        { x: 430, y: 90, type: 'fire', collected: false },
      ],
      exits: {
        water: { x: 350, y: 70, w: 36, h: 60 },
        fire: { x: 410, y: 70, w: 36, h: 60 }
      }
    },

    // 关卡 3: 齿轮机关阵 (多重连锁开关)
    {
      name: '第 3 关 · 齿轮迷阵',
      p1Start: { x: 50, y: 400 },
      p2Start: { x: 700, y: 400 },
      platforms: [
        { x: 0, y: 450, w: 800, h: 50, type: 'stone' },
        { x: 0, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 770, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 0, y: 0, w: 800, h: 30, type: 'wall' },

        { x: 150, y: 350, w: 180, h: 20, type: 'stone' },
        { x: 470, y: 350, w: 180, h: 20, type: 'stone' },
        { x: 300, y: 240, w: 200, h: 20, type: 'stone' },
        { x: 80, y: 150, w: 200, h: 20, type: 'stone' },
        { x: 520, y: 150, w: 200, h: 20, type: 'stone' },
      ],
      hazards: [
        { x: 260, y: 435, w: 140, h: 18, type: 'fire' },
        { x: 400, y: 435, w: 140, h: 18, type: 'water' },
      ],
      boxes: [
        { x: 220, y: 310, w: 32, h: 32, vx: 0, vy: 0, isGrounded: false },
        { x: 540, y: 310, w: 32, h: 32, vx: 0, vy: 0, isGrounded: false }
      ],
      buttons: [
        { id: 'b3_1', x: 200, y: 138, w: 30, h: 12, color: '#38bdf8', pressed: false, targetDoor: 'd3_1' },
        { id: 'b3_2', x: 570, y: 138, w: 30, h: 12, color: '#f97316', pressed: false, targetDoor: 'd3_2' },
      ],
      doors: [
        { id: 'd3_1', x: 380, y: 160, w: 14, h: 80, open: false, openOffset: 0, color: '#38bdf8' },
        { id: 'd3_2', x: 406, y: 160, w: 14, h: 80, open: false, openOffset: 0, color: '#f97316' },
      ],
      diamonds: [
        { x: 180, y: 310, type: 'water', collected: false },
        { x: 600, y: 310, type: 'fire', collected: false },
        { x: 370, y: 200, type: 'water', collected: false },
        { x: 420, y: 200, type: 'fire', collected: false },
      ],
      exits: {
        water: { x: 120, y: 90, w: 36, h: 60 },
        fire: { x: 640, y: 90, w: 36, h: 60 }
      }
    },

    // 关卡 4: 终焉双生神殿 (终极考验)
    {
      name: '第 4 关 · 终焉双生',
      p1Start: { x: 50, y: 400 },
      p2Start: { x: 90, y: 400 },
      platforms: [
        { x: 0, y: 450, w: 800, h: 50, type: 'stone' },
        { x: 0, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 770, y: 0, w: 30, h: 500, type: 'wall' },
        { x: 0, y: 0, w: 800, h: 30, type: 'wall' },

        { x: 140, y: 350, w: 140, h: 20, type: 'stone' },
        { x: 520, y: 350, w: 140, h: 20, type: 'stone' },
        { x: 260, y: 250, w: 280, h: 20, type: 'stone' },
        { x: 120, y: 150, w: 160, h: 20, type: 'stone' },
        { x: 520, y: 150, w: 160, h: 20, type: 'stone' },
        { x: 320, y: 90, w: 160, h: 20, type: 'stone' },
      ],
      hazards: [
        { x: 180, y: 435, w: 120, h: 18, type: 'fire' },
        { x: 340, y: 435, w: 120, h: 18, type: 'toxic' },
        { x: 500, y: 435, w: 120, h: 18, type: 'water' },
      ],
      boxes: [
        { x: 380, y: 210, w: 32, h: 32, vx: 0, vy: 0, isGrounded: false }
      ],
      buttons: [
        { id: 'b4_1', x: 200, y: 338, w: 30, h: 12, color: '#38bdf8', pressed: false, targetDoor: 'd4_1' },
        { id: 'b4_2', x: 570, y: 338, w: 30, h: 12, color: '#f97316', pressed: false, targetDoor: 'd4_2' },
      ],
      doors: [
        { id: 'd4_1', x: 330, y: 30, w: 14, h: 60, open: false, openOffset: 0, color: '#38bdf8' },
        { id: 'd4_2', x: 456, y: 30, w: 14, h: 60, open: false, openOffset: 0, color: '#f97316' },
      ],
      diamonds: [
        { x: 200, y: 310, type: 'water', collected: false },
        { x: 580, y: 310, type: 'fire', collected: false },
        { x: 380, y: 50, type: 'water', collected: false },
        { x: 420, y: 50, type: 'fire', collected: false },
      ],
      exits: {
        water: { x: 350, y: 30, w: 36, h: 60 },
        fire: { x: 410, y: 30, w: 36, h: 60 }
      }
    }
  ];

  let currentLevel = null;

  function init(containerEl, mode = 'solo', role = 1) {
    isCoopPvp = mode === 'pvp';
    myRole = role;
    currentLevelIdx = 0;
    score = 0;

    containerEl.innerHTML = `
      <div class="arcade-arena-wrapper">
        <!-- 街机 HUD -->
        <div class="arcade-hud-bar">
          <div class="arcade-hud-left">
            <div class="hud-stat-pill p1"><span>🐢 帕帕:</span> <b id="templeP1Dia">0 💎</b></div>
            <div class="hud-stat-pill p2"><span>🎃 小南瓜:</span> <b id="templeP2Dia">0 💎</b></div>
          </div>
          <div class="arcade-hud-center">
            <div class="hud-stat-pill score" id="templeLevelTitle">第 1 关 · 初入神殿</div>
          </div>
          <div class="arcade-hud-right">
            <div class="hud-stat-pill"><span>🏆 积分:</span> <b id="templeScore">0</b></div>
            <button class="game-scale-btn reset-btn" id="templeRestartBtn" title="重新开始本关" style="pointer-events: auto;">↺</button>
          </div>
        </div>

        <div class="arcade-canvas-box">
          <canvas id="templeCanvas" width="800" height="500"></canvas>
        </div>

        <div class="arcade-controls-hint">
          <span>🐢 帕帕: <kbd>A</kbd><kbd>D</kbd> 移动 <kbd>W</kbd> 跳跃</span>
          <span>|</span>
          <span>🎃 小南瓜: <kbd>←</kbd><kbd>→</kbd> 移动 <kbd>↑</kbd> 跳跃</span>
          <span>|</span>
          <span>按 <kbd>R</kbd> 重生</span>
        </div>
      </div>
    `;

    canvas = document.getElementById('templeCanvas');
    ctx = canvas.getContext('2d');

    document.getElementById('templeRestartBtn').onclick = () => loadLevel(currentLevelIdx);

    bindEvents();
    loadLevel(0);
    isRunning = true;
    loop();
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
    if (e.code === 'KeyR') {
      loadLevel(currentLevelIdx);
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function loadLevel(idx) {
    if (idx >= LEVELS.length) {
      handleGameWin();
      return;
    }
    currentLevelIdx = idx;
    // 深拷贝关卡数据
    currentLevel = JSON.parse(JSON.stringify(LEVELS[idx]));

    p1.x = currentLevel.p1Start.x;
    p1.y = currentLevel.p1Start.y;
    p1.vx = 0; p1.vy = 0;
    p1.alive = true;
    p1.inDoor = false;

    p2.x = currentLevel.p2Start.x;
    p2.y = currentLevel.p2Start.y;
    p2.vx = 0; p2.vy = 0;
    p2.alive = true;
    p2.inDoor = false;

    particles = [];
    floatingTexts = [];

    const titleEl = document.getElementById('templeLevelTitle');
    if (titleEl) titleEl.textContent = currentLevel.name;
    updateHUD();
  }

  function updateHUD() {
    const p1El = document.getElementById('templeP1Dia');
    const p2El = document.getElementById('templeP2Dia');
    const scoreEl = document.getElementById('templeScore');
    if (p1El) p1El.textContent = `${p1.diamonds} 💎`;
    if (p2El) p2El.textContent = `${p2.diamonds} 💎`;
    if (scoreEl) scoreEl.textContent = score;
  }

  function loop() {
    if (!isRunning) return;
    update();
    render();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    if (!currentLevel) return;

    // 1. 玩家 1 (帕帕) 操控与物理 (本地或非联机)
    if (!isCoopPvp || myRole === 1) {
      if (keys['KeyA']) p1.vx = -3.8;
      else if (keys['KeyD']) p1.vx = 3.8;
      else p1.vx *= 0.75;

      if ((keys['KeyW'] || keys['Space']) && p1.isGrounded && p1.alive) {
        p1.vy = -10.5;
        p1.isGrounded = false;
        createJumpDust(p1.x + p1.w / 2, p1.y + p1.h, '#38bdf8');
      }
    }

    // 2. 玩家 2 (小南瓜) 操控与物理
    if (!isCoopPvp || myRole === 2) {
      if (keys['ArrowLeft']) p2.vx = -3.8;
      else if (keys['ArrowRight']) p2.vx = 3.8;
      else p2.vx *= 0.75;

      if (keys['ArrowUp'] && p2.isGrounded && p2.alive) {
        p2.vy = -10.5;
        p2.isGrounded = false;
        createJumpDust(p2.x + p2.w / 2, p2.y + p2.h, '#f97316');
      }
    }

    // 重力应用
    [p1, p2].forEach(p => {
      if (!p.alive) return;
      p.vy += 0.48; // 重力加速度
      if (p.vy > 12) p.vy = 12;

      // 移动与平台碰撞
      p.x += p.vx;
      handleHorizCollisions(p);

      p.y += p.vy;
      p.isGrounded = false;
      handleVertCollisions(p);

      // 危险水火池判定
      checkHazardCollisions(p);
    });

    // 3. 箱子物理与碰撞
    if (currentLevel.boxes) {
      currentLevel.boxes.forEach(b => {
        b.vy += 0.48;
        b.x += b.vx;
        b.vx *= 0.8;
        handleHorizBoxCollisions(b);
        b.y += b.vy;
        b.isGrounded = false;
        handleVertBoxCollisions(b);

        // 玩家推箱子
        [p1, p2].forEach(p => {
          if (checkOverlap(p, b)) {
            if (p.x < b.x) {
              b.vx = 2.5;
              p.x = b.x - p.w;
            } else {
              b.vx = -2.5;
              p.x = b.x + b.w;
            }
          }
        });
      });
    }

    // 4. 按钮机关与门/升降梯联动
    if (currentLevel.buttons) {
      currentLevel.buttons.forEach(btn => {
        let isPressed = false;
        // 检查是否有玩家或箱子踩在按钮上
        [p1, p2].forEach(p => {
          if (p.alive && checkOverlap(p, { x: btn.x, y: btn.y - 4, w: btn.w, h: btn.h + 4 })) {
            isPressed = true;
          }
        });
        if (currentLevel.boxes) {
          currentLevel.boxes.forEach(b => {
            if (checkOverlap(b, { x: btn.x, y: btn.y - 4, w: btn.w, h: btn.h + 4 })) {
              isPressed = true;
            }
          });
        }
        btn.pressed = isPressed;

        // 联动门
        if (btn.targetDoor && currentLevel.doors) {
          const door = currentLevel.doors.find(d => d.id === btn.targetDoor);
          if (door) {
            if (btn.pressed) {
              door.openOffset = Math.min(door.h - 4, door.openOffset + 3);
              door.open = true;
            } else {
              door.openOffset = Math.max(0, door.openOffset - 2);
              door.open = door.openOffset > 0;
            }
          }
        }

        // 联动升降梯
        if (btn.targetElevator && currentLevel.elevators) {
          const el = currentLevel.elevators.find(e => e.id === btn.targetElevator);
          if (el) {
            if (btn.pressed) {
              if (el.currentY > el.targetY) el.currentY -= el.speed;
            } else {
              if (el.currentY < el.startY) el.currentY += el.speed;
            }
            el.y = el.currentY;
          }
        }
      });
    }

    // 5. 钻石拾取
    if (currentLevel.diamonds) {
      currentLevel.diamonds.forEach(d => {
        if (d.collected) return;
        if (d.type === 'water' && p1.alive && checkOverlap(p1, { x: d.x - 10, y: d.y - 10, w: 20, h: 20 })) {
          d.collected = true;
          p1.diamonds += 1;
          score += 100;
          createDiamondGlow(d.x, d.y, '#38bdf8');
          updateHUD();
        } else if (d.type === 'fire' && p2.alive && checkOverlap(p2, { x: d.x - 10, y: d.y - 10, w: 20, h: 20 })) {
          d.collected = true;
          p2.diamonds += 1;
          score += 100;
          createDiamondGlow(d.x, d.y, '#f97316');
          updateHUD();
        }
      });
    }

    // 6. 终点传送门判定
    if (currentLevel.exits) {
      p1.inDoor = p1.alive && checkOverlap(p1, currentLevel.exits.water);
      p2.inDoor = p2.alive && checkOverlap(p2, currentLevel.exits.fire);

      if (p1.inDoor && p2.inDoor) {
        // 通关本关
        score += 500;
        addFloatingText(400, 200, '✨ 圣殿共生！关卡突破！', '#fde047');
        setTimeout(() => loadLevel(currentLevelIdx + 1), 600);
      }
    }

    // 7. 更新粒子与飘字
    updateParticles();
  }

  function handleHorizCollisions(p) {
    const colliders = [...currentLevel.platforms, ...(currentLevel.doors || []).filter(d => !d.open || d.openOffset < d.h - 10)];
    colliders.forEach(c => {
      const cy = c.openOffset ? c.y + c.openOffset : c.y;
      const ch = c.openOffset ? c.h - c.openOffset : c.h;
      if (checkOverlap(p, { x: c.x, y: cy, w: c.w, h: ch })) {
        if (p.vx > 0) p.x = c.x - p.w;
        else if (p.vx < 0) p.x = c.x + c.w;
        p.vx = 0;
      }
    });
  }

  function handleVertCollisions(p) {
    const colliders = [...currentLevel.platforms, ...(currentLevel.doors || []).filter(d => !d.open || d.openOffset < d.h - 10), ...(currentLevel.elevators || [])];
    colliders.forEach(c => {
      const cy = c.openOffset ? c.y + c.openOffset : (c.currentY || c.y);
      const ch = c.openOffset ? c.h - c.openOffset : c.h;
      if (checkOverlap(p, { x: c.x, y: cy, w: c.w, h: ch })) {
        if (p.vy > 0) {
          p.y = cy - p.h;
          p.vy = 0;
          p.isGrounded = true;
        } else if (p.vy < 0) {
          p.y = cy + ch;
          p.vy = 0;
        }
      }
    });
  }

  function handleHorizBoxCollisions(b) {
    currentLevel.platforms.forEach(c => {
      if (checkOverlap(b, c)) {
        if (b.vx > 0) b.x = c.x - b.w;
        else if (b.vx < 0) b.x = c.x + c.w;
        b.vx = 0;
      }
    });
  }

  function handleVertBoxCollisions(b) {
    currentLevel.platforms.forEach(c => {
      if (checkOverlap(b, c)) {
        if (b.vy > 0) {
          b.y = c.y - b.h;
          b.vy = 0;
          b.isGrounded = true;
        } else if (b.vy < 0) {
          b.y = c.y + c.h;
          b.vy = 0;
        }
      }
    });
  }

  function checkHazardCollisions(p) {
    if (!currentLevel.hazards) return;
    currentLevel.hazards.forEach(h => {
      if (checkOverlap(p, h)) {
        if (h.type === 'water' && p.type === 'fire') {
          killPlayer(p, '小南瓜在灵泉水中熄灭了！');
        } else if (h.type === 'fire' && p.type === 'water') {
          killPlayer(p, '帕帕在烈火熔岩中蒸发了！');
        } else if (h.type === 'toxic') {
          killPlayer(p, `${p.name}跌入了剧毒泥沼！`);
        }
      }
    });
  }

  function killPlayer(p, reason) {
    if (!p.alive) return;
    p.alive = false;
    createExplosion(p.x + p.w / 2, p.y + p.h / 2, p.color);
    addFloatingText(p.x, p.y - 20, reason, '#ef4444');
    setTimeout(() => loadLevel(currentLevelIdx), 900);
  }

  function checkOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // -------------------------------------------------------------------------
  // 渲染层 (Canvas 60FPS Render)
  // -------------------------------------------------------------------------
  function render() {
    if (!ctx || !currentLevel) return;

    // 1. 背景渐变
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 500);
    bgGrad.addColorStop(0, '#0a0e1a');
    bgGrad.addColorStop(1, '#161f36');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 500);

    // 绘制神殿神秘符文背景网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 800; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 40; y < 500; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // 2. 绘制传送门
    if (currentLevel.exits) {
      drawExitDoor(currentLevel.exits.water, '#38bdf8', '💧', p1.inDoor);
      drawExitDoor(currentLevel.exits.fire, '#f97316', '🔥', p2.inDoor);
    }

    // 3. 绘制危险池 (水池、火池、毒池)
    if (currentLevel.hazards) {
      currentLevel.hazards.forEach(h => {
        ctx.save();
        if (h.type === 'water') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.strokeStyle = '#38bdf8';
        } else if (h.type === 'fire') {
          ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
          ctx.strokeStyle = '#f97316';
        } else {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.75)';
          ctx.strokeStyle = '#22c55e';
        }
        ctx.lineWidth = 2;
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeRect(h.x, h.y, h.w, h.h);

        // 液体微波纹
        ctx.fillStyle = '#ffffff';
        for (let i = 4; i < h.w; i += 16) {
          ctx.fillRect(h.x + i, h.y + 2, 8, 2);
        }
        ctx.restore();
      });
    }

    // 4. 绘制平台墙体
    currentLevel.platforms.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.type === 'wall' ? '#1e293b' : '#334155';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // 古老石砖纹路
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      for (let bx = p.x + 20; bx < p.x + p.w; bx += 30) {
        ctx.beginPath(); ctx.moveTo(bx, p.y); ctx.lineTo(bx, p.y + p.h); ctx.stroke();
      }
      ctx.restore();
    });

    // 5. 绘制升降梯
    if (currentLevel.elevators) {
      currentLevel.elevators.forEach(el => {
        ctx.save();
        ctx.fillStyle = '#eab308';
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.strokeStyle = '#fef08a';
        ctx.strokeRect(el.x, el.y, el.w, el.h);
        ctx.restore();
      });
    }

    // 6. 绘制机关门与开关
    if (currentLevel.doors) {
      currentLevel.doors.forEach(d => {
        ctx.save();
        ctx.fillStyle = d.color;
        const cy = d.y + (d.openOffset || 0);
        const ch = d.h - (d.openOffset || 0);
        ctx.fillRect(d.x, cy, d.w, ch);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(d.x, cy, d.w, ch);
        ctx.restore();
      });
    }

    if (currentLevel.buttons) {
      currentLevel.buttons.forEach(btn => {
        ctx.save();
        ctx.fillStyle = btn.pressed ? '#64748b' : btn.color;
        const bh = btn.pressed ? 4 : btn.h;
        const by = btn.pressed ? btn.y + 8 : btn.y;
        ctx.fillRect(btn.x, by, btn.w, bh);
        ctx.restore();
      });
    }

    // 7. 绘制活动推箱
    if (currentLevel.boxes) {
      currentLevel.boxes.forEach(b => {
        ctx.save();
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // 木纹交叉线
        ctx.beginPath();
        ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.moveTo(b.x + b.w, b.y); ctx.lineTo(b.x, b.y + b.h);
        ctx.stroke();
        ctx.restore();
      });
    }

    // 8. 绘制灵石钻石
    if (currentLevel.diamonds) {
      currentLevel.diamonds.forEach(d => {
        if (d.collected) return;
        drawDiamond(d.x, d.y, d.type === 'water' ? '#38bdf8' : '#f97316');
      });
    }

    // 9. 绘制玩家角色 (帕帕 & 小南瓜)
    if (p1.alive) drawHero(p1);
    if (p2.alive) drawHero(p2);

    // 10. 绘制粒子与浮动文字
    renderParticles();
  }

  function drawHero(p) {
    ctx.save();
    // 光晕
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;

    // 圆角方块身体
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, [8]);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 绘制可爱头像 Emoji
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.avatar, p.x + p.w / 2, p.y + p.h / 2 + 1);

    ctx.restore();
  }

  function drawDiamond(x, y, color) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 7, y);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 7, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawExitDoor(door, color, symbol, active) {
    ctx.save();
    ctx.fillStyle = active ? color : 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(door.x, door.y, door.w, door.h, [14, 14, 0, 0]);
    ctx.fill();
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, door.x + door.w / 2, door.y + door.h / 2);
    ctx.restore();
  }

  // 粒子特效
  function createJumpDust(x, y, color) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        life: 18,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  }

  function createDiamondGlow(x, y, color) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 25,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  }

  function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 30,
        color: color,
        size: 4 + Math.random() * 4
      });
    }
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 45 });
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
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  function handleGameWin() {
    stop();
    if (typeof GamesArena !== 'undefined' && typeof GamesArena.handleGameOver === 'function') {
      GamesArena.handleGameOver(myRole, `恭喜通关《水火共生 · 灵泉圣殿》全部 4 大难关！斩获积分 ${score}！`);
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
