/* ==========================================================================
   帕帕 · 小南瓜 | 沉浸式摸鱼隐匿系统引擎 (Stealth Mode Engine)
   挂载于顶部任务栏挂件后，提供：透明度无级调节、鼠标移出自动隐形淡化、毛玻璃磨砂虚化与画中画微缩
   ========================================================================== */

const StealthMode = (() => {
  const STORAGE_KEY = 'sanctuary_stealth_config';

  const config = {
    enabled: false,
    opacity: 0.65,
    autoFade: true,
    blurOnLeave: true,
    pipMode: false,
    autoMute: true
  };

  let popoverOpen = false;
  let lastEscTime = 0;

  function init() {
    loadConfig();
    injectTopStealthButton();
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

  // 1. 绑定或注入顶部任务栏挂件之后的摸鱼按钮
  function injectTopStealthButton() {
    let btn = document.getElementById('topStealthBtn');
    if (!btn) {
      const topActions = document.querySelector('.topbar .top-actions');
      const modeBtn = document.getElementById('modeBtn');
      if (topActions) {
        btn = document.createElement('button');
        btn.className = 'window-mode stealth-btn';
        btn.id = 'topStealthBtn';
        btn.title = '开启/配置摸鱼隐匿模式 (Alt + ~)';
        btn.innerHTML = `<span>🐟</span> 摸鱼模式`;
        if (modeBtn && modeBtn.nextSibling) {
          topActions.insertBefore(btn, modeBtn.nextSibling);
        } else {
          topActions.appendChild(btn);
        }
      }
    }
    if (btn) {
      btn.onclick = togglePopover;
    }
  }

  // 2. 切换摸鱼配置弹层 (挂载在顶部按钮下方，不影响主内容比例)
  function togglePopover(e) {
    if (e) e.stopPropagation();
    popoverOpen = !popoverOpen;

    let popover = document.getElementById('stealthPopover');
    if (popover) {
      popover.remove();
      if (!popoverOpen) return;
    }

    if (!popoverOpen) return;

    popover = document.createElement('div');
    popover.className = 'stealth-settings-popover';
    popover.id = 'stealthPopover';
    popover.innerHTML = `
      <div class="stealth-popover-header">
        <h3><span>🐟</span> 摸鱼隐匿设置</h3>
        <small>快捷键: Alt+~ / 双击ESC</small>
      </div>

      <!-- 主开关 -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(56, 189, 248, 0.12); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);">
        <b style="color: #7dd3fc; font-size: 13px;">摸鱼总开关</b>
        <input type="checkbox" id="stealthMasterSwitch" ${config.enabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #10b981; cursor: pointer;" />
      </div>

      <!-- 快速透明度预设 -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 11px; color: #94a3b8;">透明度快捷预设:</span>
        <div class="stealth-presets-row">
          <div class="stealth-preset-chip ${config.opacity <= 0.35 ? 'active' : ''}" data-op="0.3">🌫️ 极淡 30%</div>
          <div class="stealth-preset-chip ${config.opacity > 0.35 && config.opacity <= 0.7 ? 'active' : ''}" data-op="0.6">🌤️ 半透 60%</div>
          <div class="stealth-preset-chip ${config.opacity > 0.7 ? 'active' : ''}" data-op="1.0">☀️ 清晰 100%</div>
        </div>
      </div>

      <!-- 无级透明度滑动条 -->
      <div class="stealth-slider-group">
        <div class="stealth-slider-label">
          <span>淡化通透度:</span>
          <b id="stealthSliderVal">${Math.round(config.opacity * 100)}%</b>
        </div>
        <input type="range" id="stealthSliderInput" min="20" max="100" value="${Math.round(config.opacity * 100)}" />
      </div>

      <!-- 隐匿功能开关列表 -->
      <div class="stealth-switches-list">
        <label class="stealth-switch-item">
          <span>🖱️ 鼠标移出自动隐形淡化</span>
          <input type="checkbox" id="stealthAutoFadeToggle" ${config.autoFade ? 'checked' : ''} />
        </label>
        <label class="stealth-switch-item">
          <span>🌫️ 鼠标移出毛玻璃虚化</span>
          <input type="checkbox" id="stealthBlurToggle" ${config.blurOnLeave ? 'checked' : ''} />
        </label>
        <label class="stealth-switch-item">
          <span>🖼️ 极简微缩画中画模式</span>
          <input type="checkbox" id="stealthPipToggle" ${config.pipMode ? 'checked' : ''} />
        </label>
        <label class="stealth-switch-item">
          <span>🔇 开启时自动静音游戏</span>
          <input type="checkbox" id="stealthMuteToggle" ${config.autoMute ? 'checked' : ''} />
        </label>
      </div>

      <div class="stealth-hotkey-hint">提示：任何时候按下 Alt+~ 或双击 ESC 可快速最小化</div>
    `;

    document.body.appendChild(popover);

    // 绑定交互
    const masterSwitch = document.getElementById('stealthMasterSwitch');
    if (masterSwitch) {
      masterSwitch.onchange = (e) => {
        config.enabled = e.target.checked;
        applyState();
        saveConfig();
      };
    }

    popover.querySelectorAll('.stealth-preset-chip').forEach(chip => {
      chip.onclick = () => {
        const val = parseFloat(chip.dataset.op);
        config.opacity = val;
        config.enabled = true;
        if (masterSwitch) masterSwitch.checked = true;
        const slider = document.getElementById('stealthSliderInput');
        const sliderVal = document.getElementById('stealthSliderVal');
        if (slider) slider.value = Math.round(val * 100);
        if (sliderVal) sliderVal.textContent = `${Math.round(val * 100)}%`;
        popover.querySelectorAll('.stealth-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyState();
        saveConfig();
      };
    });

    const slider = document.getElementById('stealthSliderInput');
    const sliderVal = document.getElementById('stealthSliderVal');
    if (slider) {
      slider.oninput = (e) => {
        const val = parseInt(e.target.value, 10);
        config.opacity = val / 100;
        config.enabled = true;
        if (masterSwitch) masterSwitch.checked = true;
        if (sliderVal) sliderVal.textContent = `${val}%`;
        applyState();
        saveConfig();
      };
    }

    const autoFadeToggle = document.getElementById('stealthAutoFadeToggle');
    if (autoFadeToggle) {
      autoFadeToggle.onchange = (e) => {
        config.autoFade = e.target.checked;
        applyState();
        saveConfig();
      };
    }

    const blurToggle = document.getElementById('stealthBlurToggle');
    if (blurToggle) {
      blurToggle.onchange = (e) => {
        config.blurOnLeave = e.target.checked;
        applyState();
        saveConfig();
      };
    }

    const pipToggle = document.getElementById('stealthPipToggle');
    if (pipToggle) {
      pipToggle.onchange = (e) => {
        config.pipMode = e.target.checked;
        applyState();
        saveConfig();
      };
    }

    const muteToggle = document.getElementById('stealthMuteToggle');
    if (muteToggle) {
      muteToggle.onchange = (e) => {
        config.autoMute = e.target.checked;
        applyState();
        saveConfig();
      };
    }
  }

  // 3. 应用摸鱼状态
  function applyState() {
    const appShell = document.getElementById('appShell');
    const stage = document.getElementById('gamesStage');
    const topBtn = document.getElementById('topStealthBtn');

    document.body.classList.toggle('stealth-on', config.enabled);
    document.documentElement.classList.toggle('stealth-on', config.enabled);

    if (!appShell) return;

    appShell.classList.remove('stealth-active', 'stealth-autofade', 'stealth-blur');
    if (stage) stage.classList.remove('stealth-active', 'stealth-autofade', 'stealth-blur', 'stealth-pip');

    if (config.enabled) {
      appShell.classList.add('stealth-active');
      if (config.autoFade) appShell.classList.add('stealth-autofade');
      if (config.blurOnLeave) appShell.classList.add('stealth-blur');
      appShell.style.setProperty('--stealth-opacity', config.opacity);

      if (stage) {
        stage.classList.add('stealth-active');
        if (config.autoFade) stage.classList.add('stealth-autofade');
        if (config.blurOnLeave) stage.classList.add('stealth-blur');
        if (config.pipMode) stage.classList.add('stealth-pip');
        stage.style.setProperty('--stealth-opacity', config.opacity);
      }

      if (topBtn) {
        topBtn.classList.add('active');
        topBtn.innerHTML = `<span>🐟</span> 摸鱼中`;
      }
    } else {
      if (topBtn) {
        topBtn.classList.remove('active');
        topBtn.innerHTML = `<span>🐟</span> 摸鱼模式`;
      }
    }
  }

  // 4. 老板键 (Alt + ~ 或 双击 ESC) 快速最小化 / 恢复
  function bindHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === '`' || e.key === '~' || e.code === 'Backquote')) {
        e.preventDefault();
        config.enabled = !config.enabled;
        applyState();
        saveConfig();
        return;
      }

      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscTime < 450) {
          // 快速双击 ESC：快速最小化窗口
          if (window.electronAPI && typeof window.electronAPI.minimize === 'function') {
            window.electronAPI.minimize();
          } else {
            config.enabled = !config.enabled;
            applyState();
            saveConfig();
          }
        }
        lastEscTime = now;
      }
    });

    document.addEventListener('click', (e) => {
      if (popoverOpen && !e.target.closest('#stealthPopover') && !e.target.closest('#topStealthBtn')) {
        popoverOpen = false;
        const p = document.getElementById('stealthPopover');
        if (p) p.remove();
      }
    });
  }

  // 页面加载完成后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }

  return {
    init,
    toggle: () => {
      config.enabled = !config.enabled;
      applyState();
      saveConfig();
    },
    getConfig: () => ({ ...config })
  };
})();
