/* ==========================================================================
   帕帕 · 小南瓜 | 游艺棋阁 — 东方经典棋类对弈与休闲小游戏引擎 (Games Arena Engine)
   包含：五子棋、斗兽棋、中国象棋、飞行棋四大经典棋类
   支持：高智商 AI 对弈 (Smart AI) 与 共养者远程在线联机 (Multiplayer Online)
   ========================================================================== */

const GamesArena = (() => {
  // 当前激活的游戏状态
  let currentGame = null; // 'gomoku' | 'animals' | 'xiangqi' | 'ludo'
  let gameMode = 'ai'; // 'ai' | 'pvp'
  let aiDifficulty = 'hard'; // 'easy' | 'medium' | 'hard'
  let currentTurn = 'player'; // 'player' | 'opponent' (或 'red' | 'black', 'p1' | 'p2')
  let isGameOver = false;
  let moveHistory = [];

  // 各小游戏独立状态
  let gomokuState = null;
  let animalsState = null;
  let xiangqiState = null;
  let ludoState = null;

  // 战绩记录
  let gameStats = {
    gomoku: { wins: 0, losses: 0, draws: 0 },
    animals: { wins: 0, losses: 0, draws: 0 },
    xiangqi: { wins: 0, losses: 0, draws: 0 },
    ludo: { wins: 0, losses: 0, draws: 0 }
  };

  // -------------------------------------------------------------------------
  // 1. Web Audio 原生音效合成 (棋子落盘、木质清脆声、掷骰子、胜利礼花)
  // -------------------------------------------------------------------------
  function playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'stone') {
        // 五子棋/黑白玉石落子清脆高频敲击
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
        // 象棋/木质棋子沉稳啪嗒声
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
        // 吃子/斗兽胜利
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
        // 掷骰子摇晃声
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
        // 胜利凯旋和弦 (C-E-G-C)
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
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------------------
  // 2. 界面切换与大厅控制器
  // -------------------------------------------------------------------------
  function showLobby() {
    currentGame = null;
    isGameOver = false;
    const lobbyView = document.getElementById('gamesLobbyView');
    const playView = document.getElementById('gamesPlayView');
    if (lobbyView) lobbyView.classList.remove('hidden');
    if (playView) playView.classList.add('hidden');
    renderLobbyStats();
  }

  function renderLobbyStats() {
    const stats = JSON.parse(localStorage.getItem('sanctuary_games_stats') || JSON.stringify(gameStats));
    ['gomoku', 'animals', 'xiangqi', 'ludo'].forEach(g => {
      const s = stats[g] || { wins: 0, losses: 0 };
      const el = document.getElementById(`${g}StatText`);
      if (el) el.innerHTML = `胜: <b>${s.wins}</b> / 负: <b>${s.losses}</b>`;
    });
  }

  function startSelectedGame(gameKey, mode = 'ai') {
    currentGame = gameKey;
    gameMode = mode;
    isGameOver = false;
    moveHistory = [];

    const lobbyView = document.getElementById('gamesLobbyView');
    const playView = document.getElementById('gamesPlayView');
    if (lobbyView) lobbyView.classList.add('hidden');
    if (playView) playView.classList.remove('hidden');

    const titleMap = {
      gomoku: '⚪⚫ 五子棋 · 智弈天元',
      animals: '🐘🦁 斗兽棋 · 丛林争霸',
      xiangqi: '🪓👑 中国象棋 · 楚河汉界',
      ludo: '✈️🎲 飞行棋 · 星际航线'
    };

    const titleEl = document.getElementById('gameCurrentTitle');
    if (titleEl) titleEl.textContent = titleMap[gameKey] || '经典对弈';

    const modePill = document.getElementById('gameModePill');
    if (modePill) modePill.textContent = mode === 'ai' ? '🤖 人机智能对弈' : '👥 共养者双人联机';

    // 初始化对应棋盘
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

    const isMyTurn = currentTurn === 'player' || currentTurn === 'red' || currentTurn === 'p1';

    if (banner) {
      if (isGameOver) {
        banner.textContent = '🏁 对局已结束';
      } else {
        banner.textContent = isMyTurn ? '✦ 你的回合 ✦' : (gameMode === 'ai' ? '🤖 思考中...' : '⏳ 伙伴的回合');
      }
    }

    if (playerCard) playerCard.classList.toggle('active-turn', isMyTurn && !isGameOver);
    if (opponentCard) opponentCard.classList.toggle('active-turn', !isMyTurn && !isGameOver);
  }

  function handleGameOver(winner, reason = '') {
    isGameOver = true;
    updateTurnDisplay();

    const isWin = winner === 'player' || winner === 'red' || winner === 'p1';
    const isDraw = winner === 'draw';

    // 播放音效
    if (isWin) playSound('win');

    // 奖励禅意与英雄币
    let zenReward = isWin ? 60 : (isDraw ? 20 : 10);
    let coinReward = isWin ? 15 : (isDraw ? 5 : 2);

    if (typeof state !== 'undefined') {
      state.zen = (state.zen || 0) + zenReward;
      state.heroCoins = (state.heroCoins || 0) + coinReward;
      if (typeof persist === 'function') persist();
      if (typeof render === 'function') render();
    }

    // 记录统计
    const stats = JSON.parse(localStorage.getItem('sanctuary_games_stats') || JSON.stringify(gameStats));
    if (!stats[currentGame]) stats[currentGame] = { wins: 0, losses: 0, draws: 0 };
    if (isWin) stats[currentGame].wins += 1;
    else if (isDraw) stats[currentGame].draws += 1;
    else stats[currentGame].losses += 1;
    localStorage.setItem('sanctuary_games_stats', JSON.stringify(stats));

    // 渲染结算弹窗
    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    const modal = document.createElement('div');
    modal.className = 'game-result-modal';
    modal.id = 'gameResultModal';
    modal.innerHTML = `
      <div class="game-result-card">
        <div class="game-result-icon">${isWin ? '🏆' : (isDraw ? '🤝' : '💫')}</div>
        <h2>${isWin ? '旗开得胜 · 斩获大捷！' : (isDraw ? '棋逢敌手 · 势均力敌' : '惜败一筹 · 再接再厉')}</h2>
        <p>${reason || (isWin ? '恭喜你在智慧博弈中赢得胜利！' : '胜败乃兵家常事，随时可以再来一局！')}</p>
        <div class="game-result-rewards">
          <span>✦ +${zenReward} 禅意</span>
          <span>🪙 +${coinReward} 英雄币</span>
        </div>
        <div class="game-result-btns">
          <button class="btn-restart" id="gameRestartBtn">🔄 再来一局</button>
          <button class="btn-back-lobby" id="gameResultBackBtn">‹ 返回棋阁</button>
        </div>
      </div>
    `;
    arena.appendChild(modal);

    document.getElementById('gameRestartBtn').onclick = () => {
      modal.remove();
      startSelectedGame(currentGame, gameMode);
    };
    document.getElementById('gameResultBackBtn').onclick = () => {
      modal.remove();
      showLobby();
    };
  }

  // =========================================================================
  // 3. 【五子棋】(Gomoku) 核心引擎与启发式高智商 AI
  // =========================================================================
  function initGomoku() {
    const size = 15;
    gomokuState = {
      size: 15,
      board: Array(size).fill(0).map(() => Array(size).fill(0)), // 0:空, 1:黑(玩家), 2:白(AI/伙伴)
      lastMove: null
    };
    currentTurn = 'player';
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
    if (currentTurn !== 'player') return;
    if (gomokuState.board[r][c] !== 0) return;

    makeGomokuMove(r, c, 1);
    playSound('stone');

    if (gameMode === 'pvp') {
      sendRemoteAction({ game: 'gomoku', action: 'move', r, c, val: 1 });
    }

    if (checkGomokuWin(r, c, 1)) {
      handleGameOver('player', '五子连珠！黑子气势如虹，赢得胜利！');
      return;
    }

    currentTurn = 'opponent';
    updateTurnDisplay();

    if (gameMode === 'ai' && !isGameOver) {
      setTimeout(makeGomokuAiMove, 350);
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
      // 前向
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === playerVal) {
        count++; nr += dr; nc += dc;
      }
      // 反向
      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === playerVal) {
        count++; nr -= dr; nc -= dc;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // 五子棋高智商启发式 AI
  function makeGomokuAiMove() {
    if (isGameOver) return;
    const b = gomokuState.board;
    let bestScore = -Infinity;
    let bestMoves = [];

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (b[r][c] === 0) {
          // 计算攻防综合权重
          const aiOffense = evaluateGomokuPoint(r, c, 2);
          const aiDefense = evaluateGomokuPoint(r, c, 1);
          // 权衡攻守：如果对方即将成五(活四/死四)，防守权重极高；若自身可成五，进攻优先
          const score = aiOffense >= 100000 ? aiOffense * 2 : (aiOffense + aiDefense * 1.15) + (15 - Math.abs(r-7) - Math.abs(c-7));

          if (score > bestScore) {
            bestScore = score;
            bestMoves = [[r, c]];
          } else if (score === bestScore) {
            bestMoves.push([r, c]);
          }
        }
      }
    }

    if (bestMoves.length > 0) {
      const [aiR, aiC] = bestMoves[Math.floor(Math.random() * bestMoves.length)];
      makeGomokuMove(aiR, aiC, 2);
      playSound('stone');

      if (checkGomokuWin(aiR, aiC, 2)) {
        handleGameOver('opponent', 'AI 棋圣玄武完成了五子连线！');
        return;
      }

      currentTurn = 'player';
      updateTurnDisplay();
    }
  }

  function evaluateGomokuPoint(r, c, playerVal) {
    const dirs = [[1,0], [0,1], [1,1], [1,-1]];
    const b = gomokuState.board;
    let totalScore = 0;

    for (let [dr, dc] of dirs) {
      let count = 1;
      let openEnds = 0;

      // 前向
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === playerVal) {
        count++; nr += dr; nc += dc;
      }
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === 0) openEnds++;

      // 反向
      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === playerVal) {
        count++; nr -= dr; nc -= dc;
      }
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === 0) openEnds++;

      if (count >= 5) totalScore += 1000000;
      else if (count === 4 && openEnds === 2) totalScore += 100000;
      else if (count === 4 && openEnds === 1) totalScore += 15000;
      else if (count === 3 && openEnds === 2) totalScore += 10000;
      else if (count === 3 && openEnds === 1) totalScore += 1200;
      else if (count === 2 && openEnds === 2) totalScore += 500;
      else if (count === 2 && openEnds === 1) totalScore += 100;
    }
    return totalScore;
  }

  // =========================================================================
  // 4. 【斗兽棋】(Animal Chess / Dou Shou Qi) 核心引擎与 Alpha-Beta AI
  // =========================================================================
  const ANIMAL_RANKS = {
    rat: { rank: 1, name: '鼠', icon: '🐭' },
    cat: { rank: 2, name: '猫', icon: '🐱' },
    dog: { rank: 3, name: '狗', icon: '🐶' },
    wolf: { rank: 4, name: '狼', icon: '🐺' },
    leopard: { rank: 5, name: '豹', icon: '🐆' },
    tiger: { rank: 6, name: '虎', icon: '🐯' },
    lion: { rank: 7, name: '狮', icon: '🦁' },
    elephant: { rank: 8, name: '象', icon: '🐘' }
  };

  function initAnimals() {
    animalsState = {
      board: Array(9).fill(null).map(() => Array(7).fill(null)),
      selected: null,
      validMoves: []
    };

    // P1 (玩家，底部)
    animalsState.board[6][0] = { type: 'elephant', player: 1 };
    animalsState.board[6][2] = { type: 'wolf', player: 1 };
    animalsState.board[6][4] = { type: 'leopard', player: 1 };
    animalsState.board[6][6] = { type: 'rat', player: 1 };
    animalsState.board[7][1] = { type: 'cat', player: 1 };
    animalsState.board[7][5] = { type: 'dog', player: 1 };
    animalsState.board[8][0] = { type: 'tiger', player: 1 };
    animalsState.board[8][6] = { type: 'lion', player: 1 };

    // P2 (AI/伙伴，顶部)
    animalsState.board[2][6] = { type: 'elephant', player: 2 };
    animalsState.board[2][4] = { type: 'wolf', player: 2 };
    animalsState.board[2][2] = { type: 'leopard', player: 2 };
    animalsState.board[2][0] = { type: 'rat', player: 2 };
    animalsState.board[1][5] = { type: 'cat', player: 2 };
    animalsState.board[1][1] = { type: 'dog', player: 2 };
    animalsState.board[0][6] = { type: 'tiger', player: 2 };
    animalsState.board[0][0] = { type: 'lion', player: 2 };

    currentTurn = 'player';
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
    if (player === 1) return r === 0 && c === 3; // P1的目标敌方兽穴
    if (player === 2) return r === 8 && c === 3; // P2的目标敌方兽穴
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
    if (currentTurn !== 'player') return;

    const piece = animalsState.board[r][c];

    // 选择自己动物
    if (piece && piece.player === 1) {
      animalsState.selected = [r, c];
      animalsState.validMoves = getAnimalValidMoves(r, c, 1, animalsState.board);
      renderAnimalsBoard();
      return;
    }

    // 移动已选动物
    if (animalsState.selected) {
      const [sr, sc] = animalsState.selected;
      const isValid = animalsState.validMoves.some(([vr, vc]) => vr === r && vc === c);
      if (isValid) {
        makeAnimalMove(sr, sc, r, c);
        playSound(piece ? 'capture' : 'wood');

        if (gameMode === 'pvp') {
          sendRemoteAction({ game: 'animals', action: 'move', sr, sc, tr: r, tc: c });
        }

        if (isDenCell(r, c, 1)) {
          handleGameOver('player', '直捣敌巢！蓝方小动物成功攻入敌方兽穴！');
          return;
        }

        currentTurn = 'opponent';
        animalsState.selected = null;
        animalsState.validMoves = [];
        renderAnimalsBoard();
        updateTurnDisplay();

        if (gameMode === 'ai' && !isGameOver) {
          setTimeout(makeAnimalsAiMove, 450);
        }
      }
    }
  }

  function getAnimalValidMoves(r, c, player, board) {
    const piece = board[r][c];
    if (!piece) return [];
    const moves = [];
    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
    const rank = ANIMAL_RANKS[piece.type].rank;

    for (let [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= 9 || nc < 0 || nc >= 7) continue;

      // 己方兽穴不能进
      if ((player === 1 && nr === 8 && nc === 3) || (player === 2 && nr === 0 && nc === 3)) continue;

      // 狮虎跳河判定
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

      // 普通陆地/水域移动
      if (isWaterCell(nr, nc) && piece.type !== 'rat') continue;

      const target = board[nr][nc];
      if (canAnimalCapture(piece, r, c, target, nr, nc)) {
        moves.push([nr, nc]);
      }
    }
    return moves;
  }

  function canAnimalCapture(attacker, ar, ac, defender, dr, dc) {
    if (!defender) return true; // 空地可走
    if (attacker.player === defender.player) return false; // 同队不能吃

    // 敌人在我方陷阱中，攻击力归零，任何等级均可捕食
    if (isTrapCell(dr, dc, attacker.player)) return true;

    // 鼠不能从水中吃岸上的象，岸上不能吃水中的鼠
    const attackerInWater = isWaterCell(ar, ac);
    const defenderInWater = isWaterCell(dr, dc);
    if (attackerInWater && !defenderInWater) return false;
    if (!attackerInWater && defenderInWater) return false;

    const aRank = ANIMAL_RANKS[attacker.type].rank;
    const dRank = ANIMAL_RANKS[defender.type].rank;

    // 鼠吃象特例
    if (aRank === 1 && dRank === 8) return true;
    if (aRank === 8 && dRank === 1) return false;

    return aRank >= dRank;
  }

  function makeAnimalMove(sr, sc, tr, tc) {
    animalsState.board[tr][tc] = animalsState.board[sr][sc];
    animalsState.board[sr][sc] = null;
  }

  // 斗兽棋 AI
  function makeAnimalsAiMove() {
    if (isGameOver) return;
    const board = animalsState.board;
    const allMoves = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 7; c++) {
        const p = board[r][c];
        if (p && p.player === 2) {
          const valid = getAnimalValidMoves(r, c, 2, board);
          valid.forEach(([tr, tc]) => {
            allMoves.push({ sr: r, sc: c, tr, tc, piece: p });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      handleGameOver('player', '红方动物已无路可走，蓝方获胜！');
      return;
    }

    // 评分排序：进兽穴 > 吃高阶敌人 > 前进
    allMoves.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      if (isDenCell(a.tr, a.tc, 2)) scoreA += 10000;
      if (isDenCell(b.tr, b.tc, 2)) scoreB += 10000;

      const targetA = board[a.tr][a.tc];
      const targetB = board[b.tr][b.tc];
      if (targetA) scoreA += ANIMAL_RANKS[targetA.type].rank * 100;
      if (targetB) scoreB += ANIMAL_RANKS[targetB.type].rank * 100;

      scoreA += a.tr * 10; // 往下逼近
      scoreB += b.tr * 10;
      return scoreB - scoreA;
    });

    const chosen = allMoves[0];
    const target = board[chosen.tr][chosen.tc];
    makeAnimalMove(chosen.sr, chosen.sc, chosen.tr, chosen.tc);
    playSound(target ? 'capture' : 'wood');

    if (isDenCell(chosen.tr, chosen.tc, 2)) {
      handleGameOver('opponent', '红方动物攻破了南林兽穴！');
      return;
    }

    currentTurn = 'player';
    renderAnimalsBoard();
    updateTurnDisplay();
  }

  // =========================================================================
  // 5. 【中国象棋】(Xiangqi) 核心引擎与正统棋力 AI
  // =========================================================================
  const XQ_PIECES = {
    r_k: { name: '帥', color: 'red', val: 10000 },
    r_a: { name: '仕', color: 'red', val: 200 },
    r_b: { name: '相', color: 'red', val: 200 },
    r_n: { name: '傌', color: 'red', val: 450 },
    r_r: { name: '俥', color: 'red', val: 900 },
    r_c: { name: '炮', color: 'red', val: 500 },
    r_p: { name: '兵', color: 'red', val: 150 },

    b_k: { name: '將', color: 'black', val: 10000 },
    b_a: { name: '士', color: 'black', val: 200 },
    b_b: { name: '象', color: 'black', val: 200 },
    b_n: { name: '馬', color: 'black', val: 450 },
    b_r: { name: '車', color: 'black', val: 900 },
    b_c: { name: '砲', color: 'black', val: 500 },
    b_p: { name: '卒', color: 'black', val: 150 }
  };

  function initXiangqi() {
    xiangqiState = {
      board: Array(10).fill(null).map(() => Array(9).fill(null)),
      selected: null,
      validMoves: []
    };

    const b = xiangqiState.board;
    // 黑方 (顶部)
    b[0] = ['b_r', 'b_n', 'b_b', 'b_a', 'b_k', 'b_a', 'b_b', 'b_n', 'b_r'];
    b[2][1] = 'b_c'; b[2][7] = 'b_c';
    b[3][0] = 'b_p'; b[3][2] = 'b_p'; b[3][4] = 'b_p'; b[3][6] = 'b_p'; b[3][8] = 'b_p';

    // 红方 (底部)
    b[9] = ['r_r', 'r_n', 'r_b', 'r_a', 'r_k', 'r_a', 'r_b', 'r_n', 'r_r'];
    b[7][1] = 'r_c'; b[7][7] = 'r_c';
    b[6][0] = 'r_p'; b[6][2] = 'r_p'; b[6][4] = 'r_p'; b[6][6] = 'r_p'; b[6][8] = 'r_p';

    currentTurn = 'player';
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
    if (currentTurn !== 'player') return;

    const b = xiangqiState.board;
    const pKey = b[r][c];

    // 选择己方红棋
    if (pKey && XQ_PIECES[pKey].color === 'red') {
      xiangqiState.selected = [r, c];
      xiangqiState.validMoves = getXiangqiValidMoves(r, c, b);
      renderXiangqiBoard();
      return;
    }

    // 移动棋子
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

        if (targetKey === 'b_k') {
          handleGameOver('player', '绝杀！擒杀黑方主将，红方大获全胜！');
          return;
        }

        currentTurn = 'opponent';
        xiangqiState.selected = null;
        xiangqiState.validMoves = [];
        renderXiangqiBoard();
        updateTurnDisplay();

        if (gameMode === 'ai' && !isGameOver) {
          setTimeout(makeXiangqiAiMove, 500);
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

    // 1. 帅/将 (九宫格单格移动)
    if (type === 'k') {
      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      const minR = color === 'red' ? 7 : 0, maxR = color === 'red' ? 9 : 2;
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        if (nr >= minR && nr <= maxR && nc >= 3 && nc <= 5) {
          if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
        }
      }
    }
    // 2. 士 (九宫格斜移)
    else if (type === 'a') {
      const dirs = [[-1,-1], [-1,1], [1,-1], [1,1]];
      const minR = color === 'red' ? 7 : 0, maxR = color === 'red' ? 9 : 2;
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        if (nr >= minR && nr <= maxR && nc >= 3 && nc <= 5) {
          if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
        }
      }
    }
    // 3. 象/相 (田字斜飞，不过河，塞象眼检测)
    else if (type === 'b') {
      const dirs = [[-2,-2], [-2,2], [2,-2], [2,2]];
      const minR = color === 'red' ? 5 : 0, maxR = color === 'red' ? 9 : 4;
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        let eyeR = r + dr/2, eyeC = c + dc/2;
        if (nr >= minR && nr <= maxR && nc >= 0 && nc <= 8) {
          if (!b[eyeR][eyeC]) { // 象眼通畅
            if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
          }
        }
      }
    }
    // 4. 马 (日字跳，蹩马腿检测)
    else if (type === 'n') {
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
          if (!b[legR][legC]) { // 未被蹩马腿
            if (!b[nr][nc] || XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
          }
        }
      }
    }
    // 5. 车 (十字直线无阻碍)
    else if (type === 'r') {
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
    }
    // 6. 炮 (直线隔一子翻山吃)
    else if (type === 'c') {
      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      for (let [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        let hopped = false;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          if (!hopped) {
            if (!b[nr][nc]) moves.push([nr, nc]);
            else hopped = true; // 发现炮架
          } else {
            if (b[nr][nc]) {
              if (XQ_PIECES[b[nr][nc]].color !== color) moves.push([nr, nc]);
              break;
            }
          }
          nr += dr; nc += dc;
        }
      }
    }
    // 7. 兵/卒 (过河前只向前，过河后可左右)
    else if (type === 'p') {
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

  // 中国象棋 AI (局面价值评估)
  function makeXiangqiAiMove() {
    if (isGameOver) return;
    const b = xiangqiState.board;
    const allMoves = [];

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const pKey = b[r][c];
        if (pKey && XQ_PIECES[pKey].color === 'black') {
          const valid = getXiangqiValidMoves(r, c, b);
          valid.forEach(([tr, tc]) => {
            allMoves.push({ sr: r, sc: c, tr, tc, piece: pKey });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      handleGameOver('player', '黑方无子可动，红方胜出！');
      return;
    }

    // 优先吃帅 > 吃车炮 > 控制中心
    allMoves.sort((a, bMove) => {
      let scoreA = 0, scoreB = 0;
      const targetA = b[a.tr][a.tc];
      const targetB = b[bMove.tr][bMove.tc];
      if (targetA) scoreA += XQ_PIECES[targetA].val;
      if (targetB) scoreB += XQ_PIECES[targetB].val;

      // 靠近中心奖励
      scoreA += (4 - Math.abs(a.tc - 4)) * 5;
      scoreB += (4 - Math.abs(bMove.tc - 4)) * 5;

      return scoreB - scoreA;
    });

    const chosen = allMoves[0];
    const targetKey = b[chosen.tr][chosen.tc];
    b[chosen.tr][chosen.tc] = b[chosen.sr][chosen.sc];
    b[chosen.sr][chosen.sc] = null;
    playSound(targetKey ? 'capture' : 'wood');

    if (targetKey === 'r_k') {
      handleGameOver('opponent', '黑方直捣帅营，红方告负！');
      return;
    }

    currentTurn = 'player';
    renderXiangqiBoard();
    updateTurnDisplay();
  }

  // =========================================================================
  // 6. 【飞行棋】(Aeroplane Chess / Ludo) 核心引擎与 3D 掷骰
  // =========================================================================
  function initLudo() {
    ludoState = {
      // 玩家(红 P1) 与 AI(黄 P2)，各有 4 架战机
      // pos: -1(机库), 0..51(外圈公用航线), 100..105(冲刺道), 200(终点)
      planes: {
        p1: [ { id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 } ],
        p2: [ { id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 } ]
      },
      currentDice: 6,
      isRolling: false,
      hasRolled: false
    };

    currentTurn = 'player';
    renderLudoBoard();
  }

  function renderLudoBoard() {
    const arena = document.getElementById('gameArenaContent');
    if (!arena) return;

    const diceVal = ludoState.currentDice || 6;
    const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    arena.innerHTML = `
      <div class="game-player-card" id="gamePlayerCard">
        <div class="game-player-avatar">🐢</div>
        <div class="game-player-name">${state.user?.name || '帕帕饲养员'}</div>
        <div class="game-player-role">红队 · 红色停机坪</div>
        <div class="ludo-dice-controller">
          <div class="ludo-dice-box ${ludoState.isRolling ? 'rolling' : ''}" id="ludoDiceBtn">
            ${diceIcons[diceVal - 1]}
          </div>
          <small id="dicePromptText">${currentTurn === 'player' ? (!ludoState.hasRolled ? '👉 点击骰子投掷' : '点击战机起飞/前进') : '等待对方掷骰'}</small>
        </div>
      </div>

      <div class="ludo-board-container" id="ludoBoard"></div>

      <div class="game-player-card" id="gameOpponentCard">
        <div class="game-player-avatar">${gameMode === 'ai' ? '🤖' : '✨'}</div>
        <div class="game-player-name">${gameMode === 'ai' ? '王牌飞行员 (AI)' : '共养伙伴'}</div>
        <div class="game-player-role">黄队 · 黄色停机坪</div>
      </div>
    `;

    const boardEl = document.getElementById('ludoBoard');
    boardEl.innerHTML = '';

    // 生成 15x15 经典飞行棋盘网格
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cell = document.createElement('div');
        cell.className = 'ludo-cell';

        // 四角机库停机坪
        if (r <= 5 && c <= 5) cell.classList.add('red');
        else if (r <= 5 && c >= 9) cell.classList.add('yellow');
        else if (r >= 9 && c <= 5) cell.classList.add('blue');
        else if (r >= 9 && c >= 9) cell.classList.add('green');
        else if (r === 7 && c === 7) cell.classList.add('center-goal');
        else if ((r + c) % 4 === 0) cell.classList.add('red');
        else if ((r + c) % 4 === 1) cell.classList.add('yellow');
        else if ((r + c) % 4 === 2) cell.classList.add('blue');
        else cell.classList.add('green');

        // 渲染战机
        const p1Planes = ludoState.planes.p1.filter(p => isPlaneOnCell(p, r, c, 'p1'));
        const p2Planes = ludoState.planes.p2.filter(p => isPlaneOnCell(p, r, c, 'p2'));

        p1Planes.forEach(p => {
          const plane = document.createElement('div');
          plane.className = 'ludo-plane';
          plane.style.background = '#ef4444';
          plane.textContent = '✈️';
          plane.title = `红队战机 #${p.id + 1}`;
          plane.onclick = () => onLudoPlaneClick(p, 'p1');
          cell.appendChild(plane);
        });

        p2Planes.forEach(p => {
          const plane = document.createElement('div');
          plane.className = 'ludo-plane';
          plane.style.background = '#eab308';
          plane.textContent = '🛩️';
          plane.title = `黄队战机 #${p.id + 1}`;
          cell.appendChild(plane);
        });

        boardEl.appendChild(cell);
      }
    }

    const diceBtn = document.getElementById('ludoDiceBtn');
    if (diceBtn && currentTurn === 'player' && !ludoState.hasRolled) {
      diceBtn.onclick = rollLudoDice;
    }
  }

  function isPlaneOnCell(plane, r, c, player) {
    if (plane.pos === -1) {
      // 机库对应坐标
      if (player === 'p1') return (r === 2 || r === 3) && (c === 2 || c === 3);
      if (player === 'p2') return (r === 2 || r === 3) && (c === 11 || c === 12);
    }
    if (plane.pos === 200) return r === 7 && c === 7;
    // 简化映射航线
    const trackIndex = (r * 15 + c) % 52;
    return plane.pos === trackIndex;
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

      // 检查是否有可移动战机，若全在机库且点数不是 5/6，自动跳过回合
      const canMove = ludoState.planes[currentTurn === 'player' ? 'p1' : 'p2'].some(p => {
        if (p.pos === 200) return false;
        if (p.pos === -1) return ludoState.currentDice >= 5;
        return true;
      });

      if (!canMove) {
        setTimeout(passLudoTurn, 800);
      }
    }, 450);
  }

  function onLudoPlaneClick(plane, player) {
    if (isGameOver) return;
    if (currentTurn !== 'player') return;
    if (!ludoState.hasRolled) return;

    const dice = ludoState.currentDice;
    if (plane.pos === -1) {
      if (dice >= 5) {
        plane.pos = 0; // 起飞出库
        playSound('win');
      } else {
        return;
      }
    } else {
      plane.pos += dice;
      if (plane.pos >= 48) plane.pos = 200; // 入终点
      playSound('stone');
    }

    // 胜负判定：4 架飞机均到达终点
    if (ludoState.planes.p1.every(p => p.pos === 200)) {
      handleGameOver('player', '壮志凌云！红队 4 架战机全员凯旋归航！');
      return;
    }

    passLudoTurn();
  }

  function passLudoTurn() {
    ludoState.hasRolled = false;
    currentTurn = currentTurn === 'player' ? 'opponent' : 'player';
    renderLudoBoard();
    updateTurnDisplay();

    if (currentTurn === 'opponent' && gameMode === 'ai' && !isGameOver) {
      setTimeout(makeLudoAiTurn, 600);
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

      // AI 选机策略：优先起飞 > 优先进终点 > 走最前的飞机
      const dice = ludoState.currentDice;
      const planes = ludoState.planes.p2;
      let targetPlane = planes.find(p => p.pos === -1 && dice >= 5);
      if (!targetPlane) {
        targetPlane = planes.filter(p => p.pos !== -1 && p.pos !== 200)[0];
      }

      if (targetPlane) {
        if (targetPlane.pos === -1) targetPlane.pos = 13;
        else {
          targetPlane.pos += dice;
          if (targetPlane.pos >= 48) targetPlane.pos = 200;
        }
        playSound('stone');
      }

      if (planes.every(p => p.pos === 200)) {
        handleGameOver('opponent', '黄队战机先一步全部安全返航！');
        return;
      }

      setTimeout(passLudoTurn, 500);
    }, 450);
  }

  // -------------------------------------------------------------------------
  // 7. 远程 MQTT 多人联机动作同步处理 (Multiplayer Sync)
  // -------------------------------------------------------------------------
  function sendRemoteAction(actionData) {
    if (typeof broadcastGameAction === 'function') {
      broadcastGameAction(actionData);
    }
  }

  function handleRemoteAction(payload, meta) {
    if (!payload || !currentGame) return;
    if (payload.game !== currentGame) return;

    // 对方落子/动作
    if (payload.action === 'move') {
      if (payload.game === 'gomoku') {
        makeGomokuMove(payload.r, payload.c, 2);
        playSound('stone');
        if (checkGomokuWin(payload.r, payload.c, 2)) {
          handleGameOver('opponent', '共养伙伴完成了五子连线！');
          return;
        }
        currentTurn = 'player';
        updateTurnDisplay();
      } else if (payload.game === 'animals') {
        makeAnimalMove(payload.sr, payload.sc, payload.tr, payload.tc);
        playSound('wood');
        currentTurn = 'player';
        renderAnimalsBoard();
        updateTurnDisplay();
      } else if (payload.game === 'xiangqi') {
        const b = xiangqiState.board;
        b[payload.tr][payload.tc] = b[payload.sr][payload.sc];
        b[payload.sr][payload.sc] = null;
        playSound('wood');
        currentTurn = 'player';
        renderXiangqiBoard();
        updateTurnDisplay();
      }
    }
  }

  // 初始化 DOM 绑定
  function initUI() {
    const cardGomoku = document.getElementById('gameCardGomoku');
    const cardAnimals = document.getElementById('gameCardAnimals');
    const cardXiangqi = document.getElementById('gameCardXiangqi');
    const cardLudo = document.getElementById('gameCardLudo');

    if (cardGomoku) cardGomoku.onclick = () => startSelectedGame('gomoku', 'ai');
    if (cardAnimals) cardAnimals.onclick = () => startSelectedGame('animals', 'ai');
    if (cardXiangqi) cardXiangqi.onclick = () => startSelectedGame('xiangqi', 'ai');
    if (cardLudo) cardLudo.onclick = () => startSelectedGame('ludo', 'ai');

    const backLobbyBtn = document.getElementById('gameBackLobbyBtn');
    if (backLobbyBtn) backLobbyBtn.onclick = showLobby;

    const surrenderBtn = document.getElementById('gameSurrenderBtn');
    if (surrenderBtn) {
      surrenderBtn.onclick = () => {
        if (!isGameOver) handleGameOver('opponent', '认输投降，再接再厉！');
      };
    }

    const modeToggleBtn = document.getElementById('gameModeToggleBtn');
    if (modeToggleBtn) {
      modeToggleBtn.onclick = () => {
        const newMode = gameMode === 'ai' ? 'pvp' : 'ai';
        startSelectedGame(currentGame, newMode);
      };
    }
  }

  return {
    initUI,
    showLobby,
    startSelectedGame,
    handleRemoteAction,
    getCurrentGame: () => currentGame
  };
})();
