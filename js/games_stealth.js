/* ==========================================================================
   帕帕 · 小南瓜 | 游艺街机阁 — 沉浸式摸鱼伪装系统引擎 (Stealth Camouflage Engine)
   管理：VS Code IDE 伪装、Excel 伪装、灰度线框、透明度无级调节与老板键紧急遮罩
   ========================================================================== */

const StealthMode = (() => {
  const STORAGE_KEY = 'sanctuary_stealth_config';

  const config = {
    skin: 'none', // 'none' | 'code' | 'excel' | 'mono'
    opacity: 0.85,
    autoFade: false,
    autoMute: true,
    isPanic: false
  };

  let lastEscTime = 0;
  let drawerOpen = false;

  function init() {
    loadConfig();
    injectFakeElements();
    injectStealthButtons();
    bindHotkeys();
    applyState();
  }

  function loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      Object.assign(config, saved);
    } catch {}
  }

  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  // 1. 注入假 IDE 标签栏、Excel 公式栏与假行号
  function injectFakeElements() {
    const stage = document.getElementById('gamesStage');
    if (!stage) return;

    // IDE 伪装 Tabs Bar
    if (!document.getElementById('stealthIdeTabs')) {
      const tabs = document.createElement('div');
      tabs.className = 'stealth-ide-tabs-bar';
      tabs.id = 'stealthIdeTabs';
      tabs.innerHTML = `
        <div class="stealth-ide-tab"><span>📄</span> main.rs <span style="color:#888; font-size:10px; margin-left:4px;">×</span></div>
        <div class="stealth-ide-tab secondary"><span>⚙️</span> telemetry.yaml</div>
        <div class="stealth-ide-tab secondary"><span>📊</span> sync_bench.log</div>
      `;
      stage.insertBefore(tabs, stage.firstChild);
    }

    // Excel 伪装 Formula Bar
    if (!document.getElementById('stealthExcelFormula')) {
      const formula = document.createElement('div');
      formula.className = 'stealth-excel-formula-bar';
      formula.id = 'stealthExcelFormula';
      formula.innerHTML = `
        <span class="excel-fx-icon">fx</span>
        <input type="text" class="excel-formula-input" value="=SUM(B2:E18) * 1.05" readonly />
        <span style="font-size:11px; color:#94a3b8;">Sheet1 [Ready]</span>
      `;
      stage.insertBefore(formula, stage.firstChild);
    }
  }

  // 2. 注入顶栏摸鱼按钮与悬浮抽屉
  function injectStealthButtons() {
    const topActions = document.querySelector('.game-top-actions');
    if (topActions && !document.getElementById('stealthToggleBtn')) {
      const btn = document.createElement('button');
      btn.className = 'stealth-toggle-btn';
      btn.id = 'stealthToggleBtn';
      btn.title = '开启/配置摸鱼伪装模式 (Alt + ~)';
      btn.innerHTML = `<span>🐟 摸鱼</span>`;
      btn.onclick = toggleDrawer;

      topActions.insertBefore(btn, topActions.firstChild);
    }

    const lobbyBtn = document.getElementById('stealthLobbyToggleBtn');
    if (lobbyBtn) {
      lobbyBtn.onclick = toggleDrawer;
    }
  }

  function toggleDrawer(e) {
    if (e) e.stopPropagation();
    drawerOpen = !drawerOpen;

    let drawer = document.getElementById('stealthDrawer');
    if (drawer) {
      drawer.remove();
      if (!drawerOpen) return;
    }

    if (!drawerOpen) return;

    const stage = document.getElementById('gamesStage');
    if (!stage) return;

    drawer = document.createElement('div');
    drawer.className = 'stealth-drawer-popover';
    drawer.id = 'stealthDrawer';
    drawer.innerHTML = `
      <div class="stealth-drawer-title">
        <span>🐟 摸鱼模式设置</span>
        <span style="font-size: 10px; color: #38bdf8;">老板键: Alt+~ / 双击ESC</span>
      </div>

      <div style="font-size:11px; color:#94a3b8;">1. 伪装主题选择:</div>
      <div class="stealth-skin-grid">
        <div class="stealth-skin-opt ${config.skin === 'code' ? 'active' : ''}" data-skin="code">
          <span>💻</span> 极客代码
        </div>
        <div class="stealth-skin-opt ${config.skin === 'excel' ? 'active' : ''}" data-skin="excel">
          <span>📊</span> 办公表格
        </div>
        <div class="stealth-skin-opt ${config.skin === 'mono' ? 'active' : ''}" data-skin="mono">
          <span>🌫️</span> 极简灰度
        </div>
        <div class="stealth-skin-opt ${config.skin === 'none' ? 'active' : ''}" data-skin="none">
          <span>🎨</span> 原始色彩
        </div>
      </div>

      <div class="stealth-slider-row">
        <span>透明度:</span>
        <input type="range" id="stealthOpacitySlider" min="20" max="100" value="${Math.round(config.opacity * 100)}" />
        <b id="stealthOpacityVal">${Math.round(config.opacity * 100)}%</b>
      </div>

      <label class="stealth-checkbox-row">
        <span>鼠标移出时自动淡化</span>
        <input type="checkbox" id="stealthAutoFadeCheck" ${config.autoFade ? 'checked' : ''} />
      </label>

      <label class="stealth-checkbox-row">
        <span>伪装时静音游戏音频</span>
        <input type="checkbox" id="stealthAutoMuteCheck" ${config.autoMute ? 'checked' : ''} />
      </label>

      <button class="game-scale-btn reset-btn" id="stealthPanicBtn" style="background:#ef4444; color:#fff; font-weight:bold; border:none; padding:6px; border-radius:6px; font-size:11.5px; cursor:pointer;">🚨 立即进入紧急伪装遮罩</button>
    `;

    stage.appendChild(drawer);

    // 绑定抽屉交互
    drawer.querySelectorAll('.stealth-skin-opt').forEach(opt => {
      opt.onclick = () => {
        setSkin(opt.dataset.skin);
        drawer.querySelectorAll('.stealth-skin-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      };
    });

    const slider = document.getElementById('stealthOpacitySlider');
    const sliderVal = document.getElementById('stealthOpacityVal');
    if (slider) {
      slider.oninput = (e) => {
        const val = parseInt(e.target.value, 10);
        config.opacity = val / 100;
        if (sliderVal) sliderVal.textContent = `${val}%`;
        applyState();
        saveConfig();
      };
    }

    const fadeCheck = document.getElementById('stealthAutoFadeCheck');
    if (fadeCheck) {
      fadeCheck.onchange = (e) => {
        config.autoFade = e.target.checked;
        applyState();
        saveConfig();
      };
    }

    const muteCheck = document.getElementById('stealthAutoMuteCheck');
    if (muteCheck) {
      muteCheck.onchange = (e) => {
        config.autoMute = e.target.checked;
        applyState();
        saveConfig();
      };
    }

    const panicBtn = document.getElementById('stealthPanicBtn');
    if (panicBtn) {
      panicBtn.onclick = () => {
        toggleDrawer();
        triggerPanicMask();
      };
    }
  }

  function setSkin(skinName) {
    config.skin = skinName;
    applyState();
    saveConfig();
  }

  function applyState() {
    const stage = document.getElementById('gamesStage');
    const toggleBtn = document.getElementById('stealthToggleBtn');
    if (!stage) return;

    stage.classList.remove('stealth-active', 'stealth-code', 'stealth-excel', 'stealth-mono', 'stealth-autofade');

    if (config.skin !== 'none') {
      stage.classList.add('stealth-active');
      stage.classList.add(`stealth-${config.skin}`);
      if (config.autoFade) stage.classList.add('stealth-autofade');
      stage.style.setProperty('--stealth-opacity', config.opacity);

      if (toggleBtn) {
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = `<span>🐟 摸鱼中</span>`;
      }
      const lobbyBtn = document.getElementById('stealthLobbyToggleBtn');
      if (lobbyBtn) {
        lobbyBtn.classList.add('active');
        lobbyBtn.innerHTML = `<span>🐟 摸鱼中</span>`;
      }
    } else {
      if (toggleBtn) {
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = `<span>🐟 摸鱼</span>`;
      }
      const lobbyBtn = document.getElementById('stealthLobbyToggleBtn');
      if (lobbyBtn) {
        lobbyBtn.classList.remove('active');
        lobbyBtn.innerHTML = `<span>🐟 摸鱼模式</span>`;
      }
    }
  }

  // 3. 紧急老板键遮罩 (Panic / Boss Mask)
  function triggerPanicMask() {
    config.isPanic = true;
    let mask = document.getElementById('stealthPanicMask');
    if (!mask) {
      mask = document.createElement('div');
      mask.className = 'stealth-panic-mask';
      mask.id = 'stealthPanicMask';
      mask.innerHTML = `
        <div class="panic-mask-header">
          <span>● ● ●</span>
          <span>bash - user@cluster-node-04: /opt/production/sdjxh-service</span>
        </div>
        <div class="panic-mask-terminal">
          <p class="log-dim">[2026-08-21 14:58:02] INFO  org.springframework.boot.Startup - Starting Service on cluster-04 with PID 48192</p>
          <p class="log-cyan">[2026-08-21 14:58:03] INFO  org.hibernate.engine.transaction - Database connection pool initialized (HikariPool-1)</p>
          <p class="log-green">[2026-08-21 14:58:05] SUCCESS Telemetry collector started on port 9092 [protocol=gRPC/HTTP2]</p>
          <p class="log-dim">[2026-08-21 14:58:07] DEBUG SyncEngine dispatch worker: batch size 128, throughput 4.2 MB/s</p>
          <p class="log-yellow">[2026-08-21 14:58:09] WARN  GC threshold buffer at 72% - performing minor generational sweep</p>
          <p class="log-green">[2026-08-21 14:58:12] SUCCESS GC sweep completed in 1.4ms, reclaimed 342MB</p>
          <p class="log-cyan">[2026-08-21 14:58:15] INFO  Monitoring health check passed: OK (200)</p>
          <p style="color:#e2e8f0; margin-top:10px;">$ ./gradlew compileJava --continuous<br><span class="log-green">> Task :compileJava UP-TO-DATE</span><br><span style="animation: blink 1s infinite;">█</span></p>
        </div>
        <div class="panic-mask-hint">按 ESC 或 双击画面 退出遮罩</div>
      `;
      mask.ondblclick = dismissPanicMask;
      document.body.appendChild(mask);
    }
  }

  function dismissPanicMask() {
    config.isPanic = false;
    const mask = document.getElementById('stealthPanicMask');
    if (mask) mask.remove();
  }

  // 4. 快捷键监听 (Alt + ~ 或 双击 ESC)
  function bindHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === '`' || e.key === '~' || e.code === 'Backquote')) {
        e.preventDefault();
        if (config.isPanic) {
          dismissPanicMask();
        } else {
          triggerPanicMask();
        }
        return;
      }

      if (e.key === 'Escape') {
        const now = Date.now();
        if (config.isPanic) {
          dismissPanicMask();
          return;
        }
        if (now - lastEscTime < 450) {
          triggerPanicMask();
        }
        lastEscTime = now;
      }
    });

    document.addEventListener('click', (e) => {
      if (drawerOpen && !e.target.closest('#stealthDrawer') && !e.target.closest('#stealthToggleBtn')) {
        drawerOpen = false;
        const d = document.getElementById('stealthDrawer');
        if (d) d.remove();
      }
    });
  }

  return {
    init,
    setSkin,
    triggerPanicMask,
    dismissPanicMask,
    getConfig: () => ({ ...config })
  };
})();
