/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 系统主入口与全局事件调度 (Main App Controller)
   ========================================================================== */
  let currentWorldMode = 'garden'; // 'garden' | 'abyss' | 'games'

  function switchWorldMode(mode) {
    currentWorldMode = mode;
    const isGarden = mode === 'garden';
    const isAbyss = mode === 'abyss';
    const isGames = mode === 'games';

    if ($('#navGardenBtn')) $('#navGardenBtn').classList.toggle('active', isGarden);
    if ($('#navAbyssBtn')) $('#navAbyssBtn').classList.toggle('active', isAbyss);
    if ($('#navGamesBtn')) $('#navGamesBtn').classList.toggle('active', isGames);

    if ($('#gardenStage')) $('#gardenStage').classList.toggle('hidden', !isGarden);
    if ($('#abyssStage')) $('#abyssStage').classList.toggle('hidden', !isAbyss);
    if ($('#gamesStage')) $('#gamesStage').classList.toggle('hidden', !isGames);

    // 全局主题切换
    document.body.classList.toggle('theme-abyss', isAbyss);
    document.body.classList.toggle('theme-games', isGames);
    $('#appShell')?.classList.toggle('theme-abyss-mode', isAbyss);
    $('#appShell')?.classList.toggle('theme-games-mode', isGames);

    const brandTitle = $('.brand b');
    const brandSub = $('.brand small');
    if (brandTitle && brandSub) {
      if (isGames) {
        brandTitle.textContent = '游艺棋阁';
        brandSub.textContent = 'GAMES ARENA';
      } else if (isAbyss) {
        brandTitle.textContent = '地狱魔渊';
        brandSub.textContent = 'INFERNAL ABYSS';
      } else {
        brandTitle.textContent = '湖畔圣域';
        brandSub.textContent = 'PA PA & PUMPKIN';
      }
    }

    if (isGames) {
      GamesArena.showLobby();
      toast('🎮 步入游艺棋阁', '茶香袅袅，棋局初布！五子棋、斗兽棋、象棋、飞行棋恭候对弈。');
    } else if (isAbyss) {
      AbyssEngine.updateLobbyDisplay();
      toast('☬ 踏入地狱魔渊', '天地异象，幽冥魔焰骤起！已继承庭院乌龟等级与属性。');
    } else {
      toast('✦ 重返湖畔庭院', '已回到宁静治愈的湖畔圣域。');
    }
  }

  function toggleMode(force) {
    const shell = $('#appShell');
    const enabled = typeof force === 'boolean' ? force : !shell.classList.contains('widget-mode');
    shell.classList.toggle('widget-mode', enabled);
    document.body.classList.toggle('widget-body', enabled);
    $('#modeBtn').innerHTML = enabled ? '<span>⌂</span> 打开圣域' : '<span>◫</span> 任务栏挂件';
    $('#widgetMessage').textContent = enabled ? '正在任务栏巡逻' : '庭院正在展开';
    window.sanctuaryDesktop?.toggleCompact(enabled);
  }

  function bind() {
    if ($('#navGardenBtn')) $('#navGardenBtn').onclick = () => switchWorldMode('garden');
    if ($('#navAbyssBtn')) $('#navAbyssBtn').onclick = () => switchWorldMode('abyss');
    if ($('#navGamesBtn')) $('#navGamesBtn').onclick = () => switchWorldMode('games');
    if ($('#marketBtn')) $('#marketBtn').onclick = () => MarketSystem.showModal();
    AbyssEngine.initUI();
    GamesArena.initUI();
    if ($('#themeBtn')) $('#themeBtn').onclick = () => toggleTheme();
    if ($('#minWinBtn')) $('#minWinBtn').onclick = () => window.sanctuaryDesktop?.minimize();
    if ($('#maxWinBtn')) $('#maxWinBtn').onclick = () => window.sanctuaryDesktop?.maximize();
    if ($('#closeWinBtn')) $('#closeWinBtn').onclick = () => window.sanctuaryDesktop?.close();
    if ($('.topbar')) {
      $('.topbar').ondblclick = (event) => {
        if (event.target.closest('button, input, a')) return;
        window.sanctuaryDesktop?.maximize();
      };
    }
    $('#layoutBtn').onclick = () => toggleDecorEditMode();
    $('#finishLayoutBtn').onclick = () => toggleDecorEditMode(false);
    if ($('#houseWorkshopBtn')) $('#houseWorkshopBtn').onclick = () => showHouseWorkshopModal();
    $('#widgetFocusBtn')?.addEventListener('click', (e) => { e.currentTarget?.blur(); startFocus(); });
    $('#widgetMailBtn')?.addEventListener('click', (e) => { e.currentTarget?.blur(); showMessenger(); });
    $('#widgetRankBtn')?.addEventListener('click', (e) => { e.currentTarget?.blur(); showContributionModal(); });
    document.addEventListener('mouseup', (e) => {
      const btn = e.target.closest('button, [tabindex], .pet-card');
      if (btn && typeof btn.blur === 'function') {
        btn.blur();
      }
    });
    $('#chest').onclick = chestReward;
    $('#gardenStage').addEventListener('click', lakeRipple);
    $('#bubbleNote button').onclick = () => $('#bubbleNote').classList.remove('show');
    $('#modeBtn').onclick = () => toggleMode(); $('#expandWidget').onclick = () => toggleMode(false);
    $('#pinBtn').onclick = () => { const active = $('#pinBtn').classList.toggle('active'); window.sanctuaryDesktop?.setAlwaysOnTop(active); toast(active ? '已置顶' : '取消置顶', active ? '湖畔将安静地浮在桌面上。' : '窗口已恢复普通层级。'); };
    const soundBtn = $('#soundBtn');
    if (soundBtn) {
      soundBtn.onclick = () => {
        showAmbientSoundModal();
      };
      soundBtn.oncontextmenu = (e) => {
        e.preventDefault();
        showAmbientSoundModal();
      };
    }
    $('#focusSettings').onclick = showFocusSettingsModal;
    $$('.focus-chip').forEach(chip => {
      chip.onclick = () => {
        setFocusDuration(chip.dataset.mins);
      };
    });
    $('#copyChannel').onclick = async () => { try { await navigator.clipboard.writeText(state.channel); toast('已复制', `频道 ID：${state.channel}`); } catch { toast('频道 ID', state.channel); } };
    $('.channel-card').onclick = (e) => {
      if (e.target.closest('#copyChannel') || e.target.closest('#editProfileBtn')) return;
      chooseChannel();
    };
    $('.sync-state')?.addEventListener('click', chooseChannel);
    $('.nav-status')?.addEventListener('click', chooseChannel);
    $('#openContributionCard')?.addEventListener('click', showContributionModal);
    $('#editProfileBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showUserProfileModal();
    });
    $('#openMessenger').onclick = showMessenger;
    $$('.nav-item').forEach(item => item.onclick = () => {
      $$('.nav-item').forEach(nav => nav.classList.toggle('active', nav === item));
      const panel = item.dataset.panel;
      if (panel === 'shop') showShop(); else if (panel === 'collection') showCollection(); else toast('庭院', '点击湖水可泛起涟漪，拖拽摆件即可布景。');
    });
    $$('.habitat-toolbar button').forEach(button => {
      button.onclick = () => {
        $$('.habitat-toolbar button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentHabitatFilter = button.dataset.habitat;
        const stage = $('#gardenStage');
        stage.classList.toggle('focus-pond', currentHabitatFilter === 'pond');
        stage.classList.toggle('focus-land', currentHabitatFilter === 'land');
        Object.values(state.pets).forEach(pet => {
          pet.aiState = 'idle';
          pet.idleTimer = 2;
        });
        toast('庭院视角', currentHabitatFilter === 'pond' ? '看护月光池塘' : currentHabitatFilter === 'land' ? '看护晨露草坪' : '展示全庭院景致');
      };
    });
    if ($('#claimQuest')) {
      $('#claimQuest').onclick = () => {
        if (state.keyboardClaimed || (state.keyboardZen ?? 0) < 30) return;
        state.keyboardClaimed = true;
        state.zen += 80;
        recordContribution(80, 'keyboardZen');
        state.dailyCare = Math.min(5, state.dailyCare + 1);
        addPetXp('papa', 30);
        addPetXp('pumpkin', 30);
        persist();
        render();
        showZen(80, 82, 35);
        toast('✦ 领取成功', '完成键盘禅意修行，收下 80 禅意，帕帕与小南瓜各获得 30 经验！');
        sync(true);
      };
    }
    $('#overlay').addEventListener('click', event => { if (event.target === $('#overlay')) closeModal(); });
    document.addEventListener('keydown', keyboardReward);
    window.sanctuaryDesktop?.onCompactChanged((value, mode) => {
      wingMode = mode || (value ? 'unified' : 'full');
      $('#appShell').classList.toggle('widget-mode', value);
      document.body.classList.toggle('widget-body', value);
      $('#modeBtn').innerHTML = value ? '<span>⌂</span> 打开圣域' : '<span>◫</span> 任务栏挂件';
      const widgetEl = $('#widgetView');
      if (widgetEl) {
        widgetEl.classList.remove('wing-left', 'wing-right', 'wing-unified');
        if (value) {
          widgetEl.classList.add(`wing-${wingMode}`);
        }
      }
      renderGarden();
    });

    window.sanctuaryDesktop?.onSyncState((remoteState) => {
      if (!remoteState) return;
      state.zen = remoteState.zen ?? state.zen;
      state.keyboardZen = remoteState.keyboardZen ?? state.keyboardZen;
      if (typeof remoteState.keystrokes === 'number') {
        state.keystrokes = Math.max(state.keystrokes || 0, remoteState.keystrokes);
      }
      if (remoteState.contributions) state.contributions = remoteState.contributions;
      $('#zenPoints').textContent = format(state.zen);
      $('#widgetZen').textContent = format(state.zen);
      $('#widgetKeystrokes').textContent = format(state.keystrokes || 0);
      renderPetCards();
    });
  }

  function runSplashAnimation() {
    // 若作为左翼伴侣窗口直接启动，跳过开屏动画立即呈现
    if (wingMode === 'left') {
      $('#appSplash')?.remove();
      $('#appShell')?.classList.add('widget-mode');
      document.body.classList.add('widget-body');
      $('#widgetView')?.classList.add('wing-left');
      return;
    }

    const splash = $('#appSplash');
    const progressBar = $('#splashProgressBar');
    const statusText = $('#splashStatusText');
    if (!splash || !progressBar) return;

    if ($('#splashPapa .turtle-sprite')) $('#splashPapa .turtle-sprite').innerHTML = getTurtleSvg('papa');
    if ($('#splashPumpkin .turtle-sprite')) $('#splashPumpkin .turtle-sprite').innerHTML = getTurtleSvg('pumpkin');

    const steps = [
      { progress: 28, text: '正在清理月光池塘与晨露草坪...' },
      { progress: 60, text: '正在唤醒帕帕和小南瓜...' },
      { progress: 88, text: '正在准备桌面任务栏巡逻水道...' },
      { progress: 100, text: '湖畔圣域准备就绪！' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          splash.classList.add('fade-out');
          setTimeout(() => splash.remove(), 600);
        }, 300);
        return;
      }
      const step = steps[currentStep];
      progressBar.style.width = `${step.progress}%`;
      if (statusText) statusText.textContent = step.text;
      currentStep += 1;
    }, 420);
  }

  function updateClock() { $('#gameTime').textContent = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); }
  function init() {
    if (wingMode === 'left') {
      $('#appShell')?.classList.add('widget-mode');
      document.body.classList.add('widget-body');
      $('#widgetView')?.classList.add('wing-left');
    } else if (wingMode === 'right') {
      $('#appShell')?.classList.add('widget-mode');
      document.body.classList.add('widget-body');
      $('#widgetView')?.classList.add('wing-right');
    }
    runSplashAnimation();
    try {
      if (localStorage.getItem(`${STORAGE_KEY}-chest-day`) !== dayKey) {
        state.chestOpened = false;
        state.keyboardZen = 0;
        state.keyboardClaimed = false;
        localStorage.setItem(`${STORAGE_KEY}-chest-day`, dayKey);
        persist();
      }
      openChannel(); render(); bind(); initTurtleAI(); updateClock(); setInterval(updateClock, 30000);
      if (typeof AmbientEngine !== 'undefined') AmbientEngine.init();

      // 全局键盘修行监听：直接使用统一的 registerKeystroke 处理函数
      if ($('#widgetKeystrokes')) $('#widgetKeystrokes').textContent = format(state.keystrokes || 0);

      window.sanctuaryDesktop?.onGlobalKeydown(() => {
        registerKeystroke(true);
      });

      window.sanctuaryDesktop?.onSyncState((data) => {
        if (typeof data.keystrokes === 'number') {
          state.keystrokes = Math.max(state.keystrokes || 0, data.keystrokes);
          recordKeystroke(0);
          if ($('#widgetKeystrokes')) $('#widgetKeystrokes').textContent = format(state.keystrokes);
        }
        if (typeof data.zen === 'number') {
          state.zen = data.zen;
          if ($('#widgetZen')) $('#widgetZen').textContent = format(state.zen);
          if ($('#zenPoints')) $('#zenPoints').textContent = format(state.zen);
        }
      });

      // 监听 GitHub Releases 自动远程更新
      window.sanctuaryDesktop?.onUpdateMessage?.((data) => {
        if (data.status === 'available') {
          toast('🎁 发现圣域新版本', `检测到新版本 v${data.version}，正在后台静默下载...`);
        } else if (data.status === 'downloading') {
          console.log(`[AutoUpdater] 下载进度: ${data.percent}%`);
        } else if (data.status === 'downloaded') {
          const div = document.createElement('div');
          div.className = 'update-notification-box';
          div.innerHTML = `
            <div style="position:fixed;bottom:24px;right:24px;z-index:9999;background:rgba(20,26,52,0.96);border:1.5px solid rgba(255,220,120,0.8);border-radius:12px;padding:14px 18px;box-shadow:0 12px 32px rgba(0,0,0,0.6);backdrop-filter:blur(10px);color:#fff;display:flex;align-items:center;gap:14px;animation:modal-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);">
              <div>
                <div style="font-weight:800;color:#ffe682;font-size:13px;">🎉 圣域更新就绪 (v${data.version})</div>
                <div style="font-size:11.5px;color:#c0cdf5;margin-top:2px;">全新小乌龟特性已在后台下载完毕，点击立即重启升级！</div>
              </div>
              <button id="applyUpdateBtn" class="btn btn-gold" style="padding:6px 14px;font-size:12px;font-weight:800;border-radius:8px;cursor:pointer;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;box-shadow:0 2px 8px rgba(245,158,11,0.4);">立即重启</button>
            </div>
          `;
          document.body.appendChild(div);
          div.querySelector('#applyUpdateBtn')?.addEventListener('click', () => {
            window.sanctuaryDesktop?.restartAndUpdate?.();
          });
        }
      });

      updateTreeGrowth(); setInterval(updateTreeGrowth, 10000);
      setTimeout(showBubble, 4500); setInterval(showBubble, 70000);
      setInterval(() => { $('#quoteText').textContent = quotes[Math.floor(Math.random() * quotes.length)]; }, 180000);
      if (state.focus.running) { state.focus.running = false; persist(); toast('番茄钟已暂停', '重新打开后请手动继续专注。'); }
    } catch (err) {
      console.error('Init error:', err);
    }
  }
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
