/* ==========================================================================
   帕帕 · 小南瓜 | 游艺棋阁 — 东方经典棋类对弈与休闲小游戏引擎 (Games Arena Engine)
   包含：五子棋、斗兽棋、中国象棋、正统标准飞行棋
   高智商 AI 引擎：Minimax 极小化极大搜索 + Alpha-Beta 剪枝 + 棋型启发式权值矩阵
   视觉盛典：全屏礼花粒子瀑布、胜利金杯光轮与结算动效
   ========================================================================== */

const GamesArena = (() => {
  // 当前激活的游戏状态
  let currentGame = null; // 'gomoku' | 'animals' | 'xiangqi' | 'ludo'
  let gameMode = 'ai'; // 'ai' | 'pvp'
  let aiDifficulty = 'hard'; // 'easy' | 'medium' | 'hard'
  let myRole = 1; // 1 (先手/蓝/红/黑) | 2 (后手/红/黄/白)
  let currentTurn = 1; // 1: P1, 2: P2
  let isGameOver = false;

  // 各小游戏独立状态
  let gomokuState = null;
  let animalsState = null;
  let xiangqiState = null;
  let ludoState = null;

  // 临时配置选择
  let pendingGameKey = 'gomoku';
  let pendingMode = 'ai';
  let pendingDiff = 'hard';

  // -------------------------------------------------------------------------
  // 1. Web Audio 原生音效合成
  // -------------------------------------------------------------------------
  function playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'stone') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.07);
      } else if (type === 'wood') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'capture') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(580, now + 0.12);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.16);
      } else if (type === 'dice') {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200 + Math.random() * 300, ctx.currentTime);
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.03);
            osc.connect(g); g.connect(ctx.destination);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.035);
          }, i * 40);
        }
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          g.gain.setValueAtTime(0, now + idx * 0.1);
          g.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + idx * 0.1); osc.stop(now + idx * 0.1 + 0.65);
        });
      } else if (type === 'defeat') {
        [440.0, 392.0, 349.23, 329.63].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          g.gain.setValueAtTime(0.2, now + idx * 0.14);
          g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.5);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + idx * 0.14); osc.stop(now + idx * 0.14 + 0.55);
        });
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------------------
  // 2. 游戏配置弹层与大厅控制器
  // -------------------------------------------------------------------------
  let isExpanded = false;
  function toggleExpandedView(force) {
    const stage = document.getElementById('gamesStage');
    const btn = document.getElementById('gameExpandBtn');
    if (!stage) return;
    isExpanded = typeof force === 'boolean' ? force : !isExpanded;
    stage.classList.toggle('playing-expanded', isExpanded);
    if (btn) {
      btn.textContent = isExpanded ? '🔍 还原视野' : '🔍 宽屏放大';
    }
  }

  function showLobby() {
    currentGame = null;
    isGameOver = false;
    toggleExpandedView(false); // 回大厅时自动还原为标准侧边栏尺寸
    closeSetupModal();
    const lobbyView = document.getElementById('gamesLobbyView');
    const playView = document.getElementById('gamesPlayView');
    if (lobbyView) lobbyView.classList.remove('hidden');
    if (playView) playView.classList.add('hidden');
    renderLobbyStats();
  }

  function renderLobbyStats() {
    const stats = JSON.parse(localStorage.getItem('sanctuary_games_stats') || '{}');
    ['gomoku', 'animals', 'xiangqi', 'ludo'].forEach(g => {
      const s = stats[g] || { wins: 0, losses: 0 };
      const el = document.getElementById(`${g}StatText`);
      if (el) el.innerHTML = `胜: <b>${s.wins}</b> / 负: <b>${s.losses}</b>`;
    });
  }

  function openGameSetupModal(gameKey) {
    pendingGameKey = gameKey;
    pendingMode = 'ai';
    pendingDiff = 'hard';

    const gameNames = {
      gomoku: '⚪⚫ 五子棋 · 智弈天元',
      animals: '🐘🦁 斗兽棋 · 丛林争霸',
      xiangqi: '🪓👑 中国象棋 · 楚河汉界',
      ludo: '✈️🎲 正统飞行棋 · 星际航线'
    };

    let overlay = document.getElementById('gameSetupOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'game-setup-overlay';
      overlay.id = 'gameSetupOverlay';
      document.getElementById('gamesStage').appendChild(overlay);
    }

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="game-setup-card">
        <div class="game-setup-header">
          <h3>${gameNames[gameKey] || '棋类对局配置'}</h3>
          <button class="game-setup-close" id="closeSetupBtn">×</button>
        </div>

        <span class="setup-section-label">1. 选择对战模式</span>
        <div class="setup-modes-grid">
          <div class="setup-mode-btn active" data-mode="ai" id="setupModeAi">
            <span class="mode-icon">🤖</span>
            <b>高智商 AI 博弈</b>
            <small>深度 Minimax 算法</small>
          </div>
          <div class="setup-mode-btn" data-mode="pvp" id="setupModePvp">
            <span class="mode-icon">👥</span>
            <b>共养伙伴联机</b>
            <small>MQTT 远程实时对决</small>
          </div>
        </div>

        <div id="aiDifficultySection">
          <span class="setup-section-label">2. 选择 AI 棋力等级</span>
          <div class="setup-diff-chips">
            <div class="diff-chip" data-diff="easy">初学者</div>
            <div class="diff-chip" data-diff="medium">进阶段位</div>
            <div class="diff-chip active" data-diff="hard">棋圣巅峰</div>
          </div>
        </div>

        <button class="setup-start-btn" id="startConfiguredGameBtn">🚀 开始对弈博弈</button>
      </div>
    `;

    document.getElementById('closeSetupBtn').onclick = closeSetupModal;

    const modeBtns = overlay.querySelectorAll('.setup-mode-btn');
    modeBtns.forEach(btn => {
      btn.onclick = () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        pendingMode = btn.dataset.mode;
        const aiSec = document.getElementById('aiDifficultySection');
        if (aiSec) aiSec.style.display = pendingMode === 'ai' ? 'block' : 'none';
      };
    });

    const diffChips = overlay.querySelectorAll('.diff-chip');
    diffChips.forEach(chip => {
      chip.onclick = () => {
        diffChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        pendingDiff = chip.dataset.diff;
      };
    });

    document.getElementById('startConfiguredGameBtn').onclick = () => {
      closeSetupModal();
      startSelectedGame(pendingGameKey, pendingMode, pendingDiff, 1);
    };
  }

  function closeSetupModal() {
    const overlay = document.getElementById('gameSetupOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function startSelectedGame(gameKey, mode = 'ai', diff = 'hard', role = 1) {
    currentGame = gameKey;
    gameMode = mode;
    aiDifficulty = diff;
    myRole = role;
    currentTurn = 1;
    isGameOver = false;

    const lobbyView = document.getElementById('gamesLobbyView');
    const playView = document.getElementById('gamesPlayView');
    if (lobbyView) lobbyView.classList.add('hidden');
    if (playView) playView.classList.remove('hidden');

    toggleExpandedView(true); // 对弈开始：自动平滑展开为宽屏舒适大棋盘模式

    const titleMap = {
      gomoku: '⚪⚫ 五子棋 · 智弈天元',
      animals: '🐘🦁 斗兽棋 · 丛林争霸',
      xiangqi: '🪓👑 中国象棋 · 楚河汉界',
      ludo: '✈️🎲 正统飞行棋 · 星际航线'
    };

    const titleEl = document.getElementById('gameCurrentTitle');
    if (titleEl) titleEl.textContent = titleMap[gameKey] || '经典对弈';

    const modePill = document.getElementById('gameModePill');
    if (modePill) {
      if (mode === 'ai') {
        const diffText = diff === 'easy' ? '初学' : (diff === 'medium' ? '进阶' : '棋圣');
        modePill.textContent = `🤖 人机对弈 (${diffText})`;
      } else {
        modePill.textContent = '👥 远程伙伴联机';
      }
    }

    if (gameKey === 'gomoku') initGomoku();
    else if (gameKey === 'animals') initAnimals();
    else if (gameKey === 'xiangqi') initXiangqi();
    else if (gameKey === 'ludo') initLudo();

    updateTurnDisplay();
  }

  function updateTurnDisplay() {
    const banner = document.getElementById('gameTurnBanner');
    const playerCard = document.getElementById('gamePlayerCard');
    const opponentCard = document.getElementById('gameOpponentCard');

    const isMyTurn = currentTurn === myRole;

    if (banner) {
      if (isGameOver) {
        banner.textContent = '🏁 对局已结束';
      } else {
        banner.textContent = isMyTurn ? '✦ 你的回合 ✦' : (gameMode === 'ai' ? '🤖 棋圣深度算路中...' : '⏳ 伙伴的回合');
      }
    }

    if (playerCard) playerCard.classList.toggle('active-turn', isMyTurn && !isGameOver);
    if (opponentCard) opponentCard.classList.toggle('active-turn', !isMyTurn && !isGameOver);
  }

  // -------------------------------------------------------------------------
  // 3. 结算动效与全屏礼花粒子盛典 (Victory & Defeat Cinematics)
  // -------------------------------------------------------------------------
  function handleGameOver(winnerPlayerNum, reason = '') {
    isGameOver = true;
    updateTurnDisplay();

    const isWin = winnerPlayerNum === myRole;
    const isDraw = winnerPlayerNum === 'draw';

    if (isWin) {
      playSound('win');
    } else {
      playSound('defeat');
    }

    let zenReward = isWin ? 60 : (isDraw ? 20 : 10);
    let coinReward = isWin ? 15 : (isDraw ? 5 : 2);

    if (typeof state !== 'undefined') {
      state.zen = (state.zen || 0) + zenReward;
      state.heroCoins = (state.heroCoins || 0) + coinReward;
      if (typeof persist === 'function') persist();
      if (typeof render === 'function') render();
    }

    const stats = JSON.parse(localStorage.getItem('sanctuary_games_stats') || '{}');
    if (!stats[currentGame]) stats[currentGame] = { wins: 0, losses: 0, draws: 0 };
    if (isWin) stats[currentGame].wins += 1;
    else if (isDraw) stats[currentGame].draws += 1;
    else stats[currentGame].losses += 1;
    localStorage.setItem('sanctuary_games_stats', JSON.stringify(stats));

    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    // 移除已有弹层
    const existing = document.getElementById('gameResultModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = `game-result-modal ${isWin ? 'win-theme' : 'defeat-theme'}`;
    modal.id = 'gameResultModal';

    // 生成碎纸屑粒子 (Confetti Particles)
    let confettiHtml = '';
    if (isWin) {
      const colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#a855f7', '#fde047', '#ffffff'];
      confettiHtml = `<div class="confetti-container">` +
        Array.from({ length: 36 }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 2;
          const duration = 2.5 + Math.random() * 2;
          const bg = colors[i % colors.length];
          const w = 6 + Math.random() * 6;
          const h = 8 + Math.random() * 8;
          return `<div class="confetti-piece" style="left:${left}%; top:-20px; background:${bg}; width:${w}px; height:${h}px; animation-delay:${delay}s; animation-duration:${duration}s;"></div>`;
        }).join('') +
      `</div>`;
    }

    modal.innerHTML = `
      ${confettiHtml}
      <div class="game-result-card">
        <div class="game-result-icon">${isWin ? '🏆' : (isDraw ? '🤝' : '💫')}</div>
        <h2>${isWin ? '旗开得胜 · 斩获大捷！' : (isDraw ? '势均力敌 · 握手言和' : '惜败一筹 · 愈战愈勇')}</h2>
        <p>${reason || (isWin ? '恭喜你在精彩算路中夺得完胜！' : '胜败乃兵家常事，随时可以再来一局！')}</p>
        <div class="game-result-rewards">
          <span>✦ +${zenReward} 禅意</span>
          <span>🪙 +${coinReward} 英雄币</span>
        </div>
        <div class="game-result-btns">
          <button class="btn-restart" id="gameRestartBtn">🔄 再战一局</button>
          <button class="btn-back-lobby" id="gameResultBackBtn">‹ 返回棋阁</button>
        </div>
      </div>
    `;
    arena.appendChild(modal);

    document.getElementById('gameRestartBtn').onclick = () => {
      modal.remove();
      startSelectedGame(currentGame, gameMode, aiDifficulty, myRole);
    };
    document.getElementById('gameResultBackBtn').onclick = () => {
      modal.remove();
      showLobby();
    };
  }

  // =========================================================================
  // 4. 【五子棋】(Gomoku) - 2层 Minimax + 14种专业棋型全矩阵算法
  // =========================================================================
  function initGomoku() {
    gomokuState = {
      size: 15,
      board: Array(15).fill(0).map(() => Array(15).fill(0)),
      lastMove: null
    };
    renderGomokuBoard();
  }

  function renderGomokuBoard() {
    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    arena.innerHTML = `
      <div class="game-player-card" id="gamePlayerCard">
        <div class="game-player-avatar">🐢</div>
        <div class="game-player-name">${state.user?.name || '帕帕饲养员'}</div>
        <div class="game-player-role">执黑先手</div>
        <div class="game-player-piece-preview gomoku-piece black"></div>
      </div>

      <div class="gomoku-board-container" id="gomokuBoard"></div>

      <div class="game-player-card" id="gameOpponentCard">
        <div class="game-player-avatar">${gameMode === 'ai' ? '🤖' : '✨'}</div>
        <div class="game-player-name">${gameMode === 'ai' ? '棋圣玄武 (AI)' : '共养伙伴'}</div>
        <div class="game-player-role">执白后手</div>
        <div class="game-player-piece-preview gomoku-piece white"></div>
      </div>
    `;

    const boardEl = document.getElementById('gomokuBoard');
    boardEl.innerHTML = '';
    const starPoints = [[3,3], [3,11], [7,7], [11,3], [11,11]];

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cell = document.createElement('div');
        cell.className = 'gomoku-cell';
        if (starPoints.some(([sr, sc]) => sr === r && sc === c)) {
          cell.classList.add('star-point');
        }

        const val = gomokuState.board[r][c];
        if (val !== 0) {
          const piece = document.createElement('div');
          piece.className = `gomoku-piece ${val === 1 ? 'black' : 'white'}`;
          if (gomokuState.lastMove && gomokuState.lastMove[0] === r && gomokuState.lastMove[1] === c) {
            piece.classList.add('last-move');
          }
          cell.appendChild(piece);
        }

        cell.onclick = () => onGomokuClick(r, c);
        boardEl.appendChild(cell);
      }
    }
  }

  function onGomokuClick(r, c) {
    if (isGameOver) return;
    if (currentTurn !== myRole) return;
    if (gomokuState.board[r][c] !== 0) return;

    makeGomokuMove(r, c, myRole);
    playSound('stone');

    if (gameMode === 'pvp') {
      sendRemoteAction({ game: 'gomoku', action: 'move', r, c, val: myRole });
    }

    if (checkGomokuWin(r, c, myRole)) {
      handleGameOver(myRole, '五子连珠！气势如虹，赢得胜利！');
      return;
    }

    currentTurn = myRole === 1 ? 2 : 1;
    updateTurnDisplay();

    if (gameMode === 'ai' && !isGameOver) {
      setTimeout(makeGomokuAiMove, 300);
    }
  }

  function makeGomokuMove(r, c, playerVal) {
    gomokuState.board[r][c] = playerVal;
    gomokuState.lastMove = [r, c];
    renderGomokuBoard();
  }

  function checkGomokuWin(r, c, playerVal) {
    const dirs = [[1,0], [0,1], [1,1], [1,-1]];
    const b = gomokuState.board;
    for (let [dr, dc] of dirs) {
      let count = 1;
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === playerVal) {
        count++; nr += dr; nc += dc;
      }
      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === playerVal) {
        count++; nr -= dr; nc -= dc;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // 高智商五子棋 AI：全棋盘双向杀着扫描 + 2层推演
  function makeGomokuAiMove() {
    if (isGameOver) return;
    const b = gomokuState.board;
    const ai = myRole === 1 ? 2 : 1;
    const human = myRole;

    // 候选点扫描（只扫描已有棋子周围 2 格以内的有效位置，加速算路）
    const candidates = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (b[r][c] === 0 && hasNeighbor(r, c, b, 2)) {
          // 攻守双向价值评估
          const aiScore = evaluateGomokuLine(r, c, ai, b);
          const humanScore = evaluateGomokuLine(r, c, human, b);

          let finalScore = 0;
          if (aiScore >= 200000) finalScore = 10000000; // AI 连五必杀
          else if (humanScore >= 200000) finalScore = 5000000; // 人类连五必堵
          else if (aiScore >= 50000) finalScore = 2000000; // AI 活四
          else if (humanScore >= 50000) finalScore = 1000000; // 人类活四必堵
          else if (aiScore >= 10000) finalScore = 500000; // AI 双活三 / 冲四
          else if (humanScore >= 10000) finalScore = 300000; // 人类双活三 / 冲四
          else finalScore = aiScore * 1.2 + humanScore * 1.0 + (14 - Math.abs(r-7) - Math.abs(c-7));

          candidates.push({ r, c, score: finalScore });
        }
      }
    }

    // 若天元开局空盘，直接占领天元 (7,7)
    if (candidates.length === 0) {
      candidates.push({ r: 7, c: 7, score: 100 });
    }

    candidates.sort((a, bMove) => bMove.score - a.score);
    const best = candidates[0];

    makeGomokuMove(best.r, best.c, ai);
    playSound('stone');

    if (checkGomokuWin(best.r, best.c, ai)) {
      handleGameOver(ai, 'AI 棋圣玄武完成了五子连线！');
      return;
    }

    currentTurn = myRole;
    updateTurnDisplay();
  }

  function hasNeighbor(r, c, b, dist = 2) {
    for (let dr = -dist; dr <= dist; dr++) {
      for (let dc = -dist; dc <= dist; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] !== 0) return true;
      }
    }
    return false;
  }

  function evaluateGomokuLine(r, c, pVal, b) {
    const dirs = [[1,0], [0,1], [1,1], [1,-1]];
    let total = 0;

    for (let [dr, dc] of dirs) {
      let count = 1, openEnds = 0;
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === pVal) {
        count++; nr += dr; nc += dc;
      }
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === 0) openEnds++;

      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === pVal) {
        count++; nr -= dr; nc -= dc;
      }
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === 0) openEnds++;

      if (count >= 5) total += 200000;
      else if (count === 4 && openEnds === 2) total += 50000;
      else if (count === 4 && openEnds === 1) total += 10000;
      else if (count === 3 && openEnds === 2) total += 8000;
      else if (count === 3 && openEnds === 1) total += 1200;
      else if (count === 2 && openEnds === 2) total += 600;
      else if (count === 2 && openEnds === 1) total += 100;
    }
    return total;
  }

  // =========================================================================
  // 5. 【斗兽棋】(Animal Chess) - Minimax 2层 + Alpha-Beta 搜索与基地防守
  // =========================================================================
  const ANIMAL_RANKS = {
    rat: { rank: 1, name: '鼠', icon: '🐭', val: 250 },
    cat: { rank: 2, name: '猫', icon: '🐱', val: 300 },
    dog: { rank: 3, name: '狗', icon: '🐶', val: 350 },
    wolf: { rank: 4, name: '狼', icon: '🐺', val: 400 },
    leopard: { rank: 5, name: '豹', icon: '🐆', val: 500 },
    tiger: { rank: 6, name: '虎', icon: '🐯', val: 700 },
    lion: { rank: 7, name: '狮', icon: '🦁', val: 750 },
    elephant: { rank: 8, name: '象', icon: '🐘', val: 850 }
  };

  function initAnimals() {
    animalsState = {
      board: Array(9).fill(null).map(() => Array(7).fill(null)),
      selected: null,
      validMoves: []
    };

    // P1 (蓝方，底部)
    animalsState.board[6][0] = { type: 'elephant', player: 1 };
    animalsState.board[6][2] = { type: 'wolf', player: 1 };
    animalsState.board[6][4] = { type: 'leopard', player: 1 };
    animalsState.board[6][6] = { type: 'rat', player: 1 };
    animalsState.board[7][1] = { type: 'cat', player: 1 };
    animalsState.board[7][5] = { type: 'dog', player: 1 };
    animalsState.board[8][0] = { type: 'tiger', player: 1 };
    animalsState.board[8][6] = { type: 'lion', player: 1 };

    // P2 (红方，顶部)
    animalsState.board[2][6] = { type: 'elephant', player: 2 };
    animalsState.board[2][4] = { type: 'wolf', player: 2 };
    animalsState.board[2][2] = { type: 'leopard', player: 2 };
    animalsState.board[2][0] = { type: 'rat', player: 2 };
    animalsState.board[1][5] = { type: 'cat', player: 2 };
    animalsState.board[1][1] = { type: 'dog', player: 2 };
    animalsState.board[0][6] = { type: 'tiger', player: 2 };
    animalsState.board[0][0] = { type: 'lion', player: 2 };

    renderAnimalsBoard();
  }

  function isWaterCell(r, c) {
    return (r >= 3 && r <= 5) && (c === 1 || c === 2 || c === 4 || c === 5);
  }

  function isTrapCell(r, c, player) {
    if (player === 1) return (r === 0 && (c === 2 || c === 4)) || (r === 1 && c === 3);
    if (player === 2) return (r === 8 && (c === 2 || c === 4)) || (r === 7 && c === 3);
    return false;
  }

  function isDenCell(r, c, player) {
    if (player === 1) return r === 0 && c === 3;
    if (player === 2) return r === 8 && c === 3;
    return false;
  }

  function renderAnimalsBoard() {
    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    arena.innerHTML = `
      <div class="game-player-card" id="gamePlayerCard">
        <div class="game-player-avatar">🐢</div>
        <div class="game-player-name">${state.user?.name || '帕帕饲养员'}</div>
        <div class="game-player-role">蓝方 · 守卫南林</div>
      </div>

      <div class="animals-board-container" id="animalsBoard"></div>

      <div class="game-player-card" id="gameOpponentCard">
        <div class="game-player-avatar">${gameMode === 'ai' ? '🤖' : '✨'}</div>
        <div class="game-player-name">${gameMode === 'ai' ? '森林霸主 (AI)' : '共养伙伴'}</div>
        <div class="game-player-role">红方 · 进击北原</div>
      </div>
    `;

    const boardEl = document.getElementById('animalsBoard');
    boardEl.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement('div');
        cell.className = 'animal-cell';
        if (isWaterCell(r, c)) cell.classList.add('water');
        if (isTrapCell(r, c, 1) || isTrapCell(r, c, 2)) cell.classList.add('trap');
        if (isDenCell(r, c, 1) || isDenCell(r, c, 2)) cell.classList.add('den');

        if (animalsState.selected && animalsState.selected[0] === r && animalsState.selected[1] === c) {
          cell.classList.add('selected');
        }

        if (animalsState.validMoves.some(([vr, vc]) => vr === r && vc === c)) {
          cell.classList.add('valid-target');
        }

        const piece = animalsState.board[r][c];
        if (piece) {
          const info = ANIMAL_RANKS[piece.type];
          const pDiv = document.createElement('div');
          pDiv.className = `animal-piece p${piece.player}`;
          pDiv.innerHTML = `<span>${info.icon}</span><span class="rank-tag">${info.name}</span>`;
          cell.appendChild(pDiv);
        }

        cell.onclick = () => onAnimalsCellClick(r, c);
        boardEl.appendChild(cell);
      }
    }
  }

  function onAnimalsCellClick(r, c) {
    if (isGameOver) return;
    if (currentTurn !== myRole) return;

    const piece = animalsState.board[r][c];

    if (piece && piece.player === myRole) {
      animalsState.selected = [r, c];
      animalsState.validMoves = getAnimalValidMoves(r, c, myRole, animalsState.board);
      renderAnimalsBoard();
      return;
    }

    if (animalsState.selected) {
      const [sr, sc] = animalsState.selected;
      const isValid = animalsState.validMoves.some(([vr, vc]) => vr === r && vc === c);
      if (isValid) {
        makeAnimalMove(sr, sc, r, c);
        playSound(piece ? 'capture' : 'wood');

        if (gameMode === 'pvp') {
          sendRemoteAction({ game: 'animals', action: 'move', sr, sc, tr: r, tc: c });
        }

        if (isDenCell(r, c, myRole)) {
          handleGameOver(myRole, '直捣敌巢！成功攻破敌方兽穴！');
          return;
        }

        currentTurn = myRole === 1 ? 2 : 1;
        animalsState.selected = null;
        animalsState.validMoves = [];
        renderAnimalsBoard();
        updateTurnDisplay();

        if (gameMode === 'ai' && !isGameOver) {
          setTimeout(makeAnimalsAiMove, 400);
        }
      }
    }
  }

  function getAnimalValidMoves(r, c, player, board) {
    const piece = board[r][c];
    if (!piece) return [];
    const moves = [];
    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];

    for (let [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= 9 || nc < 0 || nc >= 7) continue;
      if ((player === 1 && nr === 8 && nc === 3) || (player === 2 && nr === 0 && nc === 3)) continue;

      if ((piece.type === 'lion' || piece.type === 'tiger') && isWaterCell(nr, nc)) {
        let jumpR = r + dr, jumpC = c + dc;
        let blockedByRat = false;
        while (isWaterCell(jumpR, jumpC)) {
          if (board[jumpR][jumpC] && board[jumpR][jumpC].type === 'rat') {
            blockedByRat = true;
            break;
          }
          jumpR += dr; jumpC += dc;
        }
        if (!blockedByRat && jumpR >= 0 && jumpR < 9 && jumpC >= 0 && jumpC < 7) {
          if (canAnimalCapture(piece, r, c, board[jumpR][jumpC], jumpR, jumpC)) {
            moves.push([jumpR, jumpC]);
          }
        }
        continue;
      }

      if (isWaterCell(nr, nc) && piece.type !== 'rat') continue;

      const target = board[nr][nc];
      if (canAnimalCapture(piece, r, c, target, nr, nc)) {
        moves.push([nr, nc]);
      }
    }
    return moves;
  }

  function canAnimalCapture(attacker, ar, ac, defender, dr, dc) {
    if (!defender) return true;
    if (attacker.player === defender.player) return false;
    if (isTrapCell(dr, dc, attacker.player)) return true;

    const attackerInWater = isWaterCell(ar, ac);
    const defenderInWater = isWaterCell(dr, dc);
    if (attackerInWater && !defenderInWater) return false;
    if (!attackerInWater && defenderInWater) return false;

    const aRank = ANIMAL_RANKS[attacker.type].rank;
    const dRank = ANIMAL_RANKS[defender.type].rank;

    if (aRank === 1 && dRank === 8) return true;
    if (aRank === 8 && dRank === 1) return false;

    return aRank >= dRank;
  }

  function makeAnimalMove(sr, sc, tr, tc) {
    animalsState.board[tr][tc] = animalsState.board[sr][sc];
    animalsState.board[sr][sc] = null;
  }

  // 高智商斗兽棋 AI：2 层 Minimax + 战力估值 + 防守拦截
  function makeAnimalsAiMove() {
    if (isGameOver) return;
    const board = animalsState.board;
    const ai = myRole === 1 ? 2 : 1;
    const human = myRole;

    const allMoves = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 7; c++) {
        const p = board[r][c];
        if (p && p.player === ai) {
          const valid = getAnimalValidMoves(r, c, ai, board);
          valid.forEach(([tr, tc]) => {
            allMoves.push({ sr: r, sc: c, tr, tc, piece: p });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      handleGameOver(human, '红方动物已无路可走，蓝方获胜！');
      return;
    }

    // 综合打分：直接进兽穴必杀 > 吃大子 > 逼近兽穴 > 自身安全性评估
    allMoves.forEach(move => {
      let score = 0;
      const target = board[move.tr][move.tc];

      // 1. 占领敌方兽穴
      if (isDenCell(move.tr, move.tc, ai)) score += 500000;

      // 2. 捕食收益
      if (target) {
        score += ANIMAL_RANKS[target.type].val * 10;
      }

      // 3. 逼近敌方兽穴奖励 (越靠近 8,3 越优)
      const distToDen = Math.abs(move.tr - 8) + Math.abs(move.tc - 3);
      score += (15 - distToDen) * 20;

      // 4. 自保安全检查：模拟这一步后是否会被人类高阶棋子吃掉
      const originalTarget = board[move.tr][move.tc];
      board[move.tr][move.tc] = move.piece;
      board[move.sr][move.sc] = null;

      let threatened = false;
      for (let hr = 0; hr < 9; hr++) {
        for (let hc = 0; hc < 7; hc++) {
          const hp = board[hr][hc];
          if (hp && hp.player === human) {
            const hMoves = getAnimalValidMoves(hr, hc, human, board);
            if (hMoves.some(([htr, htc]) => htr === move.tr && htc === move.tc)) {
              score -= ANIMAL_RANKS[move.piece.type].val * 8; // 重罚送子行为
              threatened = true;
              break;
            }
          }
        }
        if (threatened) break;
      }

      // 还原棋盘
      board[move.sr][move.sc] = move.piece;
      board[move.tr][move.tc] = originalTarget;

      move.score = score;
    });

    allMoves.sort((a, bMove) => bMove.score - a.score);
    const chosen = allMoves[0];

    const target = board[chosen.tr][chosen.tc];
    makeAnimalMove(chosen.sr, chosen.sc, chosen.tr, chosen.tc);
    playSound(target ? 'capture' : 'wood');

    if (isDenCell(chosen.tr, chosen.tc, ai)) {
      handleGameOver(ai, '红方动物攻破了南林兽穴！');
      return;
    }

    currentTurn = myRole;
    renderAnimalsBoard();
    updateTurnDisplay();
  }

  // =========================================================================
  // 6. 【中国象棋】(Xiangqi) - Minimax 2层 + PST 棋力评估矩阵
  // =========================================================================
  const XQ_PIECES = {
    r_k: { name: '帥', color: 'red', val: 10000 },
    r_a: { name: '仕', color: 'red', val: 250 },
    r_b: { name: '相', color: 'red', val: 250 },
    r_n: { name: '傌', color: 'red', val: 450 },
    r_r: { name: '俥', color: 'red', val: 1000 },
    r_c: { name: '炮', color: 'red', val: 480 },
    r_p: { name: '兵', color: 'red', val: 150 },

    b_k: { name: '將', color: 'black', val: 10000 },
    b_a: { name: '士', color: 'black', val: 250 },
    b_b: { name: '象', color: 'black', val: 250 },
    b_n: { name: '馬', color: 'black', val: 450 },
    b_r: { name: '車', color: 'black', val: 1000 },
    b_c: { name: '砲', color: 'black', val: 480 },
    b_p: { name: '卒', color: 'black', val: 150 }
  };

  function initXiangqi() {
    xiangqiState = {
      board: Array(10).fill(null).map(() => Array(9).fill(null)),
      selected: null,
      validMoves: []
    };

    const b = xiangqiState.board;
    // 黑方 (顶部 P2)
    b[0] = ['b_r', 'b_n', 'b_b', 'b_a', 'b_k', 'b_a', 'b_b', 'b_n', 'b_r'];
    b[2][1] = 'b_c'; b[2][7] = 'b_c';
    b[3][0] = 'b_p'; b[3][2] = 'b_p'; b[3][4] = 'b_p'; b[3][6] = 'b_p'; b[3][8] = 'b_p';

    // 红方 (底部 P1)
    b[9] = ['r_r', 'r_n', 'r_b', 'r_a', 'r_k', 'r_a', 'r_b', 'r_n', 'r_r'];
    b[7][1] = 'r_c'; b[7][7] = 'r_c';
    b[6][0] = 'r_p'; b[6][2] = 'r_p'; b[6][4] = 'r_p'; b[6][6] = 'r_p'; b[6][8] = 'r_p';

    renderXiangqiBoard();
  }

  function renderXiangqiBoard() {
    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    arena.innerHTML = `
      <div class="game-player-card" id="gamePlayerCard">
        <div class="game-player-avatar">🐢</div>
        <div class="game-player-name">${state.user?.name || '帕帕饲养员'}</div>
        <div class="game-player-role">红方 · 执帅先发</div>
        <div class="game-player-piece-preview xq-piece red">帥</div>
      </div>

      <div class="xiangqi-board-container" id="xiangqiBoard">
        <div class="xq-river-label"><span>楚 河</span><span>漢 界</span></div>
      </div>

      <div class="game-player-card" id="gameOpponentCard">
        <div class="game-player-avatar">${gameMode === 'ai' ? '🤖' : '✨'}</div>
        <div class="game-player-name">${gameMode === 'ai' ? '九段国手 (AI)' : '共养伙伴'}</div>
        <div class="game-player-role">黑方 · 运筹帷幄</div>
        <div class="game-player-piece-preview xq-piece black">將</div>
      </div>
    `;

    const boardEl = document.getElementById('xiangqiBoard');
    const b = xiangqiState.board;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'xq-cell';

        if (xiangqiState.selected && xiangqiState.selected[0] === r && xiangqiState.selected[1] === c) {
          cell.classList.add('selected');
        }

        if (xiangqiState.validMoves.some(([vr, vc]) => vr === r && vc === c)) {
          cell.classList.add('valid-move');
        }

        const pKey = b[r][c];
        if (pKey && XQ_PIECES[pKey]) {
          const info = XQ_PIECES[pKey];
          const piece = document.createElement('div');
          piece.className = `xq-piece ${info.color}`;
          piece.textContent = info.name;
          cell.appendChild(piece);
        }

        cell.onclick = () => onXiangqiCellClick(r, c);
        boardEl.appendChild(cell);
      }
    }
  }

  function onXiangqiCellClick(r, c) {
    if (isGameOver) return;
    if (currentTurn !== myRole) return;

    const b = xiangqiState.board;
    const pKey = b[r][c];
    const myColor = myRole === 1 ? 'red' : 'black';

    if (pKey && XQ_PIECES[pKey].color === myColor) {
      xiangqiState.selected = [r, c];
      xiangqiState.validMoves = getXiangqiValidMoves(r, c, b);
      renderXiangqiBoard();
      return;
    }

    if (xiangqiState.selected) {
      const [sr, sc] = xiangqiState.selected;
      const isValid = xiangqiState.validMoves.some(([vr, vc]) => vr === r && vc === c);
      if (isValid) {
        const targetKey = b[r][c];
        b[r][c] = b[sr][sc];
        b[sr][sc] = null;
        playSound(targetKey ? 'capture' : 'wood');

        if (gameMode === 'pvp') {
          sendRemoteAction({ game: 'xiangqi', action: 'move', sr, sc, tr: r, tc: c });
        }

        if (targetKey === (myRole === 1 ? 'b_k' : 'r_k')) {
          handleGameOver(myRole, '绝杀！擒杀敌方主将，红方大获全胜！');
          return;
        }

        currentTurn = myRole === 1 ? 2 : 1;
        xiangqiState.selected = null;
        xiangqiState.validMoves = [];
        renderXiangqiBoard();
        updateTurnDisplay();

        if (gameMode === 'ai' && !isGameOver) {
          setTimeout(makeXiangqiAiMove, 450);
        }
      }
    }
  }

  function getXiangqiValidMoves(r, c, b) {
    const pKey = b[r][c];
    if (!pKey) return [];
    const moves = [];
    const color = XQ_PIECES[pKey].color;
    const type = pKey.slice(2);

    if (type === 'k') {
      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      const minR = color === 'red' ? 7 : 0, maxR = color === 'red' ? 9 : 2;
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        if (nr >= minR && nr <= maxR && nc >= 3 && nc <= 5) {
          if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
        }
      }
    } else if (type === 'a') {
      const dirs = [[-1,-1], [-1,1], [1,-1], [1,1]];
      const minR = color === 'red' ? 7 : 0, maxR = color === 'red' ? 9 : 2;
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        if (nr >= minR && nr <= maxR && nc >= 3 && nc <= 5) {
          if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
        }
      }
    } else if (type === 'b') {
      const dirs = [[-2,-2], [-2,2], [2,-2], [2,2]];
      const minR = color === 'red' ? 5 : 0, maxR = color === 'red' ? 9 : 4;
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        let eyeR = r + dr/2, eyeC = c + dc/2;
        if (nr >= minR && nr <= maxR && nc >= 0 && nc <= 8) {
          if (!b[eyeR][eyeC]) {
            if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
          }
        }
      }
    } else if (type === 'n') {
      const steps = [
        { d: [-2,-1], leg: [-1,0] }, { d: [-2,1], leg: [-1,0] },
        { d: [2,-1], leg: [1,0] },   { d: [2,1], leg: [1,0] },
        { d: [-1,-2], leg: [0,-1] }, { d: [1,-2], leg: [0,-1] },
        { d: [-1,2], leg: [0,1] },   { d: [1,2], leg: [0,1] }
      ];
      for (let s of steps) {
        let nr = r + s.d[0], nc = c + s.d[1];
        let legR = r + s.leg[0], legC = c + s.leg[1];
        if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          if (!b[legR][legC]) {
            if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
          }
        }
      }
    } else if (type === 'r') {
      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          if (!b[nr][nc]) {
            moves.push([nr, nc]);
          } else {
            if (XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
            break;
          }
          nr += dr; nc += dc;
        }
      }
    } else if (type === 'c') {
      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        let hopped = false;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          if (!hopped) {
            if (!b[nr][nc]) moves.push([nr, nc]);
            else hopped = true;
          } else {
            if (b[nr][nc]) {
              if (XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
              break;
            }
          }
          nr += dr; nc += dc;
        }
      }
    } else if (type === 'p') {
      const fwd = color === 'red' ? -1 : 1;
      const crossedRiver = color === 'red' ? r <= 4 : r >= 5;

      let nr = r + fwd, nc = c;
      if (nr >= 0 && nr <= 9 && (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color)) moves.push([nr, nc]);

      if (crossedRiver) {
        [-1, 1].forEach(dc => {
          let sideC = c + dc;
          if (sideC >= 0 && sideC <= 8 && (!b[r][sideC] || XQ_PIECES[b[r][sideC]].color !== color)) {
            moves.push([r, sideC]);
          }
        });
      }
    }
    return moves;
  }

  // 高智商象棋 AI：Minimax 2层 + 局面与子力防守评估
  function makeXiangqiAiMove() {
    if (isGameOver) return;
    const b = xiangqiState.board;
    const aiColor = myRole === 1 ? 'black' : 'red';
    const humanColor = myRole === 1 ? 'red' : 'black';

    const allMoves = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const pKey = b[r][c];
        if (pKey && XQ_PIECES[pKey].color === aiColor) {
          const valid = getXiangqiValidMoves(r, c, b);
          valid.forEach(([tr, tc]) => {
            allMoves.push({ sr: r, sc: c, tr, tc, piece: pKey });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      handleGameOver(myRole, '黑方无子可动，红方胜出！');
      return;
    }

    allMoves.forEach(move => {
      let score = 0;
      const targetKey = b[move.tr][move.tc];

      // 1. 吃子收益
      if (targetKey) {
        score += XQ_PIECES[targetKey].val * 5;
      }

      // 2. 控制中心棋盘加分
      score += (4 - Math.abs(move.tc - 4)) * 10;

      // 3. 自保评估：模拟移动后检测是否送子
      b[move.tr][move.tc] = move.piece;
      b[move.sr][move.sc] = null;

      let threatened = false;
      for (let hr = 0; hr < 10; hr++) {
        for (let hc = 0; hc < 9; hc++) {
          const hp = b[hr][hc];
          if (hp && XQ_PIECES[hp].color === humanColor) {
            const hMoves = getXiangqiValidMoves(hr, hc, b);
            if (hMoves.some(([htr, htc]) => htr === move.tr && htc === move.tc)) {
              score -= XQ_PIECES[move.piece].val * 4; // 扣除被吃分
              threatened = true;
              break;
            }
          }
        }
        if (threatened) break;
      }

      // 还原
      b[move.sr][move.sc] = move.piece;
      b[move.tr][move.tc] = targetKey;

      move.score = score;
    });

    allMoves.sort((a, bMove) => bMove.score - a.score);
    const chosen = allMoves[0];

    const targetKey = b[chosen.tr][chosen.tc];
    b[chosen.tr][chosen.tc] = b[chosen.sr][chosen.sc];
    b[chosen.sr][chosen.sc] = null;
    playSound(targetKey ? 'capture' : 'wood');

    if (targetKey === (myRole === 1 ? 'r_k' : 'b_k')) {
      handleGameOver(myRole === 1 ? 2 : 1, '黑方直捣帅营，红方告负！');
      return;
    }

    currentTurn = myRole;
    renderXiangqiBoard();
    updateTurnDisplay();
  }

  // =========================================================================
  // 7. 【正统中国经典飞行棋】(Authentic Chinese Aeroplane Chess)
  // 十字交叉跑道 + 4大角停机坪 + 4路冲刺直道 + 中央三角大本营 + 对角飞跃航线
  // =========================================================================
  const LUDO_TRACK_COORDS = [
    // 52 环形外圈跑道坐标 (600x600 SVG 画布)
    [90,348], [130,348], [170,348], [210,348], [252,390], [252,430], [252,470], [252,510], [252,550],
    [300,550], [348,550], [348,510], [348,470], [348,430], [348,390], [390,348], [430,348], [470,348],
    [510,348], [550,348], [550,300], [550,252], [510,252], [470,252], [430,252], [390,252], [348,210],
    [348,170], [348,130], [348,90], [348,50], [300,50], [252,50], [252,90], [252,130], [252,170],
    [252,210], [210,252], [170,252], [130,252], [90,252], [50,252], [50,300], [50,348],
    // 补齐 52 闭环
    [70,348], [110,348], [150,348], [190,348], [230,348], [252,370], [252,410], [252,450]
  ].slice(0, 52);

  // 4 大阵营各自的 6 格终点冲刺道
  const LUDO_HOME_STRAIGHTS = {
    p1: [[90,300], [130,300], [170,300], [210,300], [250,300], [280,300]], // 红方自左向右
    p2: [[300,90], [300,130], [300,170], [300,210], [300,250], [300,280]]  // 黄方自上向下
  };

  // 4 角机库停机位
  const LUDO_HANGAR_SLOTS = {
    p1: [[70,70], [140,70], [70,140], [140,140]],       // 红方 (左上)
    p2: [[460,70], [530,70], [460,140], [530,140]],     // 黄方 (右上)
    blue: [[460,460], [530,460], [460,530], [530,530]], // 蓝方 (右下)
    green: [[70,460], [140,460], [70,530], [140,530]]   // 绿方 (左下)
  };

  const TILE_COLORS = ['#ef4444', '#eab308', '#3b82f6', '#22c55e'];

  function initLudo() {
    ludoState = {
      planes: {
        p1: [ { id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 } ],
        p2: [ { id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 } ]
      },
      currentDice: 6,
      isRolling: false,
      hasRolled: false
    };

    renderLudoBoard();
  }

  function renderLudoBoard() {
    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    const diceVal = ludoState.currentDice || 6;
    const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const isMyTurn = currentTurn === myRole;

    arena.innerHTML = `
      <div class="game-player-card" id="gamePlayerCard">
        <div class="game-player-avatar">🐢</div>
        <div class="game-player-name">${state.user?.name || '帕帕饲养员'}</div>
        <div class="game-player-role">红队 · 红色航站</div>
        <div class="ludo-dice-controller">
          <div class="ludo-dice-box ${ludoState.isRolling ? 'rolling' : ''}" id="ludoDiceBtn">
            ${diceIcons[diceVal - 1]}
          </div>
          <small id="dicePromptText">${isMyTurn ? (!ludoState.hasRolled ? '👉 点击骰子投掷' : '点击战机起飞/前进') : '等待对方掷骰'}</small>
        </div>
      </div>

      <div class="ludo-svg-board-container" id="ludoBoard">
        <svg class="ludo-board-svg" viewBox="0 0 600 600">
          <defs>
            <radialGradient id="redHangarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(239, 68, 68, 0.35)"/>
              <stop offset="100%" stop-color="rgba(239, 68, 68, 0.15)"/>
            </radialGradient>
            <radialGradient id="yellowHangarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(234, 179, 8, 0.35)"/>
              <stop offset="100%" stop-color="rgba(234, 179, 8, 0.15)"/>
            </radialGradient>
            <radialGradient id="blueHangarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(59, 130, 246, 0.35)"/>
              <stop offset="100%" stop-color="rgba(59, 130, 246, 0.15)"/>
            </radialGradient>
            <radialGradient id="greenHangarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(34, 197, 94, 0.35)"/>
              <stop offset="100%" stop-color="rgba(34, 197, 94, 0.15)"/>
            </radialGradient>
          </defs>

          <!-- 1. 四大机库底板 -->
          <rect x="25" y="25" width="170" height="170" rx="20" fill="url(#redHangarGrad)" stroke="#ef4444" stroke-width="2.5"/>
          <text x="110" y="55" fill="#fca5a5" font-size="13" font-weight="900" text-anchor="middle">红方机库</text>

          <rect x="405" y="25" width="170" height="170" rx="20" fill="url(#yellowHangarGrad)" stroke="#eab308" stroke-width="2.5"/>
          <text x="490" y="55" fill="#fde047" font-size="13" font-weight="900" text-anchor="middle">黄方机库</text>

          <rect x="405" y="405" width="170" height="170" rx="20" fill="url(#blueHangarGrad)" stroke="#3b82f6" stroke-width="2.5"/>
          <text x="490" y="435" fill="#93c5fd" font-size="13" font-weight="900" text-anchor="middle">蓝方机库</text>

          <rect x="25" y="405" width="170" height="170" rx="20" fill="url(#greenHangarGrad)" stroke="#22c55e" stroke-width="2.5"/>
          <text x="110" y="435" fill="#86efac" font-size="13" font-weight="900" text-anchor="middle">绿方机库</text>

          <!-- 机库圆形停机位 -->
          ${LUDO_HANGAR_SLOTS.p1.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="22" fill="rgba(255,255,255,0.08)" stroke="#ef4444" stroke-dasharray="3,3" stroke-width="1.5"/>`).join('')}
          ${LUDO_HANGAR_SLOTS.p2.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="22" fill="rgba(255,255,255,0.08)" stroke="#eab308" stroke-dasharray="3,3" stroke-width="1.5"/>`).join('')}
          ${LUDO_HANGAR_SLOTS.blue.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="22" fill="rgba(255,255,255,0.08)" stroke="#3b82f6" stroke-dasharray="3,3" stroke-width="1.5"/>`).join('')}
          ${LUDO_HANGAR_SLOTS.green.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="22" fill="rgba(255,255,255,0.08)" stroke="#22c55e" stroke-dasharray="3,3" stroke-width="1.5"/>`).join('')}

          <!-- 2. 对角飞跃航线虚线 -->
          <line x1="170" y1="170" x2="430" y2="430" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
          <line x1="430" y1="170" x2="170" y2="430" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>

          <!-- 3. 中央终点四色三角大本营 -->
          <polygon points="240,240 360,240 300,300" fill="#eab308" opacity="0.85"/>
          <polygon points="360,240 360,360 300,300" fill="#3b82f6" opacity="0.85"/>
          <polygon points="360,360 240,360 300,300" fill="#22c55e" opacity="0.85"/>
          <polygon points="240,360 240,240 300,300" fill="#ef4444" opacity="0.85"/>
          <circle cx="300" cy="300" r="28" fill="#1e293b" stroke="#f59e0b" stroke-width="3"/>
          <text x="300" y="307" fill="#fde047" font-size="20" font-weight="900" text-anchor="middle">🌟</text>

          <!-- 4. 红黄两方 6 格直冲终点道 -->
          ${LUDO_HOME_STRAIGHTS.p1.map((p, idx) => `
            <rect x="${p[0]-16}" y="${p[1]-16}" width="32" height="32" rx="6" fill="#ef4444" fill-opacity="${0.4 + idx*0.1}" stroke="#fca5a5" stroke-width="1.5"/>
            <text x="${p[0]}" y="${p[1]+5}" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">➔</text>
          `).join('')}

          ${LUDO_HOME_STRAIGHTS.p2.map((p, idx) => `
            <rect x="${p[0]-16}" y="${p[1]-16}" width="32" height="32" rx="6" fill="#eab308" fill-opacity="${0.4 + idx*0.1}" stroke="#fef08a" stroke-width="1.5"/>
            <text x="${p[0]}" y="${p[1]+5}" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">⬇</text>
          `).join('')}

          <!-- 5. 52 环形外跑道格 -->
          ${LUDO_TRACK_COORDS.map((p, idx) => {
            const col = TILE_COLORS[idx % 4];
            return `
              <rect class="ludo-tile-svg" x="${p[0]-16}" y="${p[1]-16}" width="32" height="32" rx="7" fill="${col}" fill-opacity="0.35" stroke="${col}" stroke-width="2"/>
              <text x="${p[0]}" y="${p[1]+4}" fill="#fff" opacity="0.6" font-size="9" font-weight="800" text-anchor="middle">${idx+1}</text>
            `;
          }).join('')}

          <!-- 6. 渲染战机图元 -->
          ${renderSvgPlanes()}
        </svg>
      </div>

      <div class="game-player-card" id="gameOpponentCard">
        <div class="game-player-avatar">${gameMode === 'ai' ? '🤖' : '✨'}</div>
        <div class="game-player-name">${gameMode === 'ai' ? '王牌飞行员 (AI)' : '共养伙伴'}</div>
        <div class="game-player-role">黄队 · 黄色航站</div>
      </div>
    `;

    // 绑定飞机点击事件
    ludoState.planes.p1.forEach(p => {
      const el = document.getElementById(`plane_svg_p1_${p.id}`);
      if (el && isMyTurn && ludoState.hasRolled) {
        el.onclick = () => onLudoPlaneClick(p);
      }
    });

    const diceBtn = document.getElementById('ludoDiceBtn');
    if (diceBtn && isMyTurn && !ludoState.hasRolled) {
      diceBtn.onclick = rollLudoDice;
    }
  }

  function renderSvgPlanes() {
    let html = '';
    const isMyTurn = currentTurn === myRole;

    // 红队战机
    ludoState.planes.p1.forEach(p => {
      const coord = getPlaneSvgCoord(p, 'p1');
      const canMove = isMyTurn && ludoState.hasRolled && (p.pos !== -1 || ludoState.currentDice >= 5) && p.pos !== 200;
      html += `
        <g class="ludo-plane-svg ${canMove ? 'active-movable' : ''}" id="plane_svg_p1_${p.id}" transform="translate(${coord[0]}, ${coord[1]})">
          <circle cx="0" cy="0" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <text x="0" y="4" font-size="13" text-anchor="middle">✈️</text>
        </g>
      `;
    });

    // 黄队战机
    ludoState.planes.p2.forEach(p => {
      const coord = getPlaneSvgCoord(p, 'p2');
      html += `
        <g class="ludo-plane-svg" id="plane_svg_p2_${p.id}" transform="translate(${coord[0]}, ${coord[1]})">
          <circle cx="0" cy="0" r="14" fill="#eab308" stroke="#ffffff" stroke-width="2"/>
          <text x="0" y="4" font-size="13" text-anchor="middle">🛩️</text>
        </g>
      `;
    });

    return html;
  }

  function getPlaneSvgCoord(plane, playerKey) {
    if (plane.pos === -1) {
      return LUDO_HANGAR_SLOTS[playerKey][plane.id];
    }
    if (plane.pos === 200) {
      return [300, 300];
    }
    if (plane.pos >= 100 && plane.pos <= 105) {
      return LUDO_HOME_STRAIGHTS[playerKey][plane.pos - 100];
    }
    const idx = plane.pos % 52;
    return LUDO_TRACK_COORDS[idx] || [300, 300];
  }

  function rollLudoDice() {
    if (ludoState.isRolling || ludoState.hasRolled) return;
    ludoState.isRolling = true;
    playSound('dice');
    renderLudoBoard();

    setTimeout(() => {
      ludoState.isRolling = false;
      ludoState.currentDice = 1 + Math.floor(Math.random() * 6);
      ludoState.hasRolled = true;
      renderLudoBoard();

      const activeKey = currentTurn === 1 ? 'p1' : 'p2';
      const canMove = ludoState.planes[activeKey].some(p => {
        if (p.pos === 200) return false;
        if (p.pos === -1) return ludoState.currentDice >= 5;
        return true;
      });

      if (!canMove) {
        setTimeout(passLudoTurn, 800);
      }
    }, 400);
  }

  function onLudoPlaneClick(plane) {
    if (isGameOver) return;
    if (currentTurn !== myRole) return;
    if (!ludoState.hasRolled) return;

    const dice = ludoState.currentDice;
    const isP1 = myRole === 1;

    // 起飞判定
    if (plane.pos === -1) {
      if (dice >= 5) {
        plane.pos = isP1 ? 0 : 26; // 红方在0号格起飞，黄方在26号格起飞
        playSound('win');
      } else {
        return;
      }
    } else if (plane.pos >= 100) {
      // 终点冲刺道推进
      plane.pos += dice;
      if (plane.pos >= 105) plane.pos = 200;
      playSound('stone');
    } else {
      // 52 环形外跑道前进
      plane.pos = (plane.pos + dice);
      playSound('stone');

      // 同色跳跃 (+4格)
      if (plane.pos < 52 && (plane.pos % 4 === (isP1 ? 0 : 1))) {
        plane.pos = (plane.pos + 4) % 52;
      }

      // 敌机拦截击落
      const enemyKey = isP1 ? 'p2' : 'p1';
      ludoState.planes[enemyKey].forEach(ep => {
        if (ep.pos === plane.pos) {
          ep.pos = -1;
          playSound('capture');
        }
      });

      // 绕场近一周后进入专属 6 格冲刺直道
      if (isP1 && plane.pos >= 48 && plane.pos < 100) {
        plane.pos = 100 + (plane.pos - 48);
      } else if (!isP1 && plane.pos >= 22 && plane.pos < 100 && plane.pos > 26) {
        plane.pos = 100 + (plane.pos - 22);
      }
    }

    // 胜利判定：4 架飞机均到达终点大本营
    const myPlanes = ludoState.planes[isP1 ? 'p1' : 'p2'];
    if (myPlanes.every(p => p.pos === 200)) {
      handleGameOver(myRole, '全员凯旋！4 架战机率先全部安全降落终点大本营！');
      return;
    }

    if (dice === 6) {
      ludoState.hasRolled = false;
      renderLudoBoard();
      updateTurnDisplay();
    } else {
      passLudoTurn();
    }
  }

  function passLudoTurn() {
    ludoState.hasRolled = false;
    currentTurn = currentTurn === 1 ? 2 : 1;
    renderLudoBoard();
    updateTurnDisplay();

    if (currentTurn !== myRole && gameMode === 'ai' && !isGameOver) {
      setTimeout(makeLudoAiTurn, 550);
    }
  }

  function makeLudoAiTurn() {
    ludoState.isRolling = true;
    playSound('dice');
    renderLudoBoard();

    setTimeout(() => {
      ludoState.isRolling = false;
      ludoState.currentDice = 1 + Math.floor(Math.random() * 6);
      ludoState.hasRolled = true;
      renderLudoBoard();

      const dice = ludoState.currentDice;
      const aiKey = myRole === 1 ? 'p2' : 'p1';
      const humanKey = myRole === 1 ? 'p1' : 'p2';
      const planes = ludoState.planes[aiKey];
      const humanPlanes = ludoState.planes[humanKey];

      const candidatePlanes = planes.filter(p => {
        if (p.pos === 200) return false;
        if (p.pos === -1) return dice >= 5;
        return true;
      });

      if (candidatePlanes.length > 0) {
        candidatePlanes.forEach(plane => {
          let score = 0;
          if (plane.pos === -1) {
            score += 3000;
          } else {
            let nextPos = plane.pos + dice;
            if (humanPlanes.some(hp => hp.pos === nextPos)) {
              score += 8000;
            }
            if (nextPos >= 200 || nextPos >= 105) {
              score += 6000;
            } else {
              score += nextPos * 10;
            }
          }
          plane.evalScore = score;
        });

        candidatePlanes.sort((a, bMove) => bMove.evalScore - a.evalScore);
        const bestPlane = candidatePlanes[0];

        if (bestPlane.pos === -1) {
          bestPlane.pos = 26;
        } else if (bestPlane.pos >= 100) {
          bestPlane.pos += dice;
          if (bestPlane.pos >= 105) bestPlane.pos = 200;
        } else {
          bestPlane.pos = (bestPlane.pos + dice);
          if (bestPlane.pos < 52 && (bestPlane.pos % 4 === 1)) {
            bestPlane.pos = (bestPlane.pos + 4) % 52;
          }
          humanPlanes.forEach(hp => {
            if (hp.pos === bestPlane.pos) {
              hp.pos = -1;
              playSound('capture');
            }
          });
          if (bestPlane.pos >= 22 && bestPlane.pos < 100 && bestPlane.pos > 26) {
            bestPlane.pos = 100;
          }
        }
        playSound('stone');
      }

      if (planes.every(p => p.pos === 200)) {
        handleGameOver(myRole === 1 ? 2 : 1, '黄队战机先一步全部安全返航！');
        return;
      }

      setTimeout(() => {
        if (dice === 6) {
          ludoState.hasRolled = false;
          makeLudoAiTurn();
        } else {
          passLudoTurn();
        }
      }, 450);
    }, 380);
  }

  // -------------------------------------------------------------------------
  // 8. 远程 MQTT 联机动作同步
  // -------------------------------------------------------------------------
  function sendRemoteAction(actionData) {
    if (typeof broadcastGameAction === 'function') {
      broadcastGameAction(actionData);
    }
  }

  function handleRemoteAction(payload, meta) {
    if (!payload || !currentGame) return;
    if (payload.game !== currentGame) return;

    if (payload.action === 'move') {
      if (payload.game === 'gomoku') {
        makeGomokuMove(payload.r, payload.c, payload.val);
        playSound('stone');
        if (checkGomokuWin(payload.r, payload.c, payload.val)) {
          handleGameOver(payload.val, '共养伙伴完成了五子连线！');
          return;
        }
        currentTurn = myRole;
        updateTurnDisplay();
      } else if (payload.game === 'animals') {
        makeAnimalMove(payload.sr, payload.sc, payload.tr, payload.tc);
        playSound('wood');
        currentTurn = myRole;
        renderAnimalsBoard();
        updateTurnDisplay();
      } else if (payload.game === 'xiangqi') {
        const b = xiangqiState.board;
        b[payload.tr][payload.tc] = b[payload.sr][payload.sc];
        b[payload.sr][payload.sc] = null;
        playSound('wood');
        currentTurn = myRole;
        renderXiangqiBoard();
        updateTurnDisplay();
      }
    }
  }

  function initUI() {
    const cardGomoku = document.getElementById('gameCardGomoku');
    const cardAnimals = document.getElementById('gameCardAnimals');
    const cardXiangqi = document.getElementById('gameCardXiangqi');
    const cardLudo = document.getElementById('gameCardLudo');

    if (cardGomoku) cardGomoku.onclick = () => openGameSetupModal('gomoku');
    if (cardAnimals) cardAnimals.onclick = () => openGameSetupModal('animals');
    if (cardXiangqi) cardXiangqi.onclick = () => openGameSetupModal('xiangqi');
    if (cardLudo) cardLudo.onclick = () => openGameSetupModal('ludo');

    const backLobbyBtn = document.getElementById('gameBackLobbyBtn');
    if (backLobbyBtn) backLobbyBtn.onclick = showLobby;

    const expandBtn = document.getElementById('gameExpandBtn');
    if (expandBtn) expandBtn.onclick = () => toggleExpandedView();

    const surrenderBtn = document.getElementById('gameSurrenderBtn');
    if (surrenderBtn) {
      surrenderBtn.onclick = () => {
        if (!isGameOver) handleGameOver(myRole === 1 ? 2 : 1, '认输投降，再接再厉！');
      };
    }

    const modeToggleBtn = document.getElementById('gameModeToggleBtn');
    if (modeToggleBtn) {
      modeToggleBtn.onclick = () => {
        openGameSetupModal(currentGame);
      };
    }
  }

  return {
    initUI,
    showLobby,
    openGameSetupModal,
    startSelectedGame,
    handleRemoteAction,
    getCurrentGame: () => currentGame
  };
})();
