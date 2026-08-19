const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');

let win;
let leftCompanionWin = null;
let tray;
let compact = false;
let compactBounds = '';
let taskbarProbeInFlight;
let keyListenerProc;
let isBossHidden = false;
const execFileAsync = promisify(execFile);

// A PowerShell child can finish writing just after Windows closes its stdio
// pipe. This is a harmless cleanup race; the next layout refresh will retry.
process.on('uncaughtException', (error) => {
  if (error?.message === 'write EOF' || error?.code === 'EOF') return;
  throw error;
});

async function readTaskbarLayout() {
  if (taskbarProbeInFlight) return taskbarProbeInFlight;
  if (process.platform !== 'win32') return null;
  taskbarProbeInFlight = (async () => {
    const source = path.join(__dirname, 'taskbar-layout.ps1');
    const target = path.join(app.getPath('userData'), 'taskbar-layout.ps1');
    const script = fs.readFileSync(source, 'utf8');
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== script) fs.writeFileSync(target, script, 'utf8');
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', target
    ], { windowsHide: true, timeout: 10000, maxBuffer: 64 * 1024 });
    return JSON.parse(stdout.trim());
  })().catch(() => null).finally(() => { taskbarProbeInFlight = undefined; });
  return taskbarProbeInFlight;
}

function pointToElectronSpace(rect, display, taskbar) {
  // GetWindowRect reports physical coordinates; Electron uses device-independent
  // coordinates. Windows applies one scale factor per display.
  const scale = display.bounds.width / (taskbar.Right - taskbar.Left);
  const taskbarIsAtTop = Math.abs(taskbar.Top - display.bounds.y) < 12;
  const physicalDisplayTop = taskbarIsAtTop
    ? taskbar.Top
    : taskbar.Bottom - display.bounds.height / scale;
  return {
    left: Math.round(display.bounds.x + (rect.Left - taskbar.Left) * scale),
    right: Math.round(display.bounds.x + (rect.Right - taskbar.Left) * scale),
    top: Math.round(display.bounds.y + (rect.Top - physicalDisplayTop) * scale),
    bottom: Math.round(display.bounds.y + (rect.Bottom - physicalDisplayTop) * scale)
  };
}

function getAppIconPath() {
  const local = path.join(__dirname, 'icon.png');
  if (fs.existsSync(local)) return local;
  const root = path.join(__dirname, '..', 'icon.png');
  if (fs.existsSync(root)) return root;
  return local;
}

function makeLeftCompanionWindow() {
  if (leftCompanionWin && !leftCompanionWin.isDestroyed()) return leftCompanionWin;
  const iconPath = getAppIconPath();
  leftCompanionWin = new BrowserWindow({
    width: 340,
    height: 40,
    minWidth: 100,
    minHeight: 32,
    frame: false,
    transparent: true,
    resizable: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    type: 'toolbar',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  leftCompanionWin.loadFile(path.join(__dirname, '..', 'index.html'), { query: { wing: 'left' } });
  leftCompanionWin.setAlwaysOnTop(true, 'screen-saver');
  leftCompanionWin.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      leftCompanionWin.hide();
    }
  });
  return leftCompanionWin;
}

function calculateTaskbarWings(taskbar, tray, appButtons) {
  const taskbarLeft = typeof taskbar?.left === 'number' ? taskbar.left : 0;
  const taskbarRight = typeof taskbar?.right === 'number' ? taskbar.right : 1920;

  // 系统托盘位置
  const trayLeft = typeof tray?.left === 'number' ? tray.left : (taskbarRight - 260);
  const trayRight = typeof tray?.right === 'number' ? tray.right : taskbarRight;

  let iconMinLeft = taskbarRight;
  let iconMaxRight = taskbarLeft;

  if (Array.isArray(appButtons) && appButtons.length > 0) {
    for (const b of appButtons) {
      if (typeof b.left !== 'number' || typeof b.right !== 'number' || isNaN(b.left) || isNaN(b.right)) continue;
      // 1. 排除托盘内部及托盘右侧区域的按钮（如“显示桌面”等）
      if (b.left >= trayLeft - 10 || b.right > trayLeft + 8) continue;
      // 2. 排除异常超宽的容器按钮
      if ((b.right - b.left) > (taskbarRight - taskbarLeft) * 0.7) continue;

      iconMinLeft = Math.min(iconMinLeft, b.left);
      iconMaxRight = Math.max(iconMaxRight, b.right);
    }
  }

  const release = os.release() || '';
  const buildNum = parseInt(release.split('.')[2] || '0', 10);
  const isWin11OrLater = buildNum >= 22000;

  // 若未检测到有效应用图标，或图标右边界过于贴近托盘（避免误判容器为图标）
  if (iconMinLeft >= iconMaxRight || isNaN(iconMinLeft) || iconMaxRight >= trayLeft - 60) {
    if (isWin11OrLater) {
      // Windows 11 默认居中预估
      const center = (taskbarLeft + taskbarRight) / 2;
      iconMinLeft = center - 220;
      iconMaxRight = center + 220;
    } else {
      // Windows 10 默认靠左预估（开始按钮 + 搜索框 + 常用图标约 380px）
      iconMinLeft = taskbarLeft + 48;
      iconMaxRight = taskbarLeft + 380;
    }
  }

  // 判断是否为靠左对齐任务栏（Windows 10 或 Windows 11 设置为靠左对齐）
  // 当任务栏图标起始位置距离最左侧小于 180px 时视为靠左
  const isLeftAligned = (iconMinLeft - taskbarLeft) < 180;

  if (isLeftAligned) {
    // 靠左布局模式：任务栏图标在左侧，图标右侧至托盘左侧为连续可用空间
    let startX = Math.max(taskbarLeft + 4, iconMaxRight + 8);
    const endX = Math.min(taskbarRight - 4, trayLeft - 8);
    let width = endX - startX;

    // 确保宽度至少有基础空间（>= 240px），若不足则自适应向左调整或平铺安全区域
    if (width < 240) {
      const maxAvailable = Math.max(240, endX - (taskbarLeft + 48));
      width = Math.min(420, maxAvailable);
      startX = Math.max(taskbarLeft + 48, endX - width);
    }

    return {
      mode: 'unified',
      single: {
        x: Math.round(startX),
        width: Math.round(width)
      }
    };
  }

  // 居中布局模式（Win11 默认）：图标在中间，左右两侧分别有可用空间
  const leftStart = taskbarLeft + 4;
  const leftEnd = Math.max(leftStart + 120, iconMinLeft - 8);
  const leftWidth = leftEnd - leftStart;

  const rightStart = Math.min(taskbarRight - 160, iconMaxRight + 8);
  const rightEnd = Math.min(taskbarRight - 4, trayLeft - 8);
  const rightWidth = rightEnd - rightStart;

  // 左右两侧均有足够空间（>= 120px）时采用双翼模式
  if (leftWidth >= 120 && rightWidth >= 120) {
    return {
      mode: 'dual',
      left: { x: Math.round(leftStart), width: Math.round(leftWidth) },
      right: { x: Math.round(rightStart), width: Math.round(rightWidth) }
    };
  }

  // 若某侧空间不足，则降级为单槽位展示在较宽的一侧
  const chosenStart = rightWidth >= leftWidth ? rightStart : leftStart;
  const chosenWidth = Math.max(240, Math.max(rightWidth, leftWidth));
  return {
    mode: 'unified',
    single: {
      x: Math.round(chosenStart),
      width: Math.round(chosenWidth)
    }
  };
}

async function placeInTaskbarGap() {
  const display = screen.getPrimaryDisplay();
  const layout = await readTaskbarLayout();
  if (!layout?.taskbar || !layout?.tray) return false;

  const rawTaskbar = layout.taskbar;
  const taskbar = pointToElectronSpace(layout.taskbar, display, rawTaskbar);
  const tray = pointToElectronSpace(layout.tray, display, rawTaskbar);
  const isBottom = Math.abs(taskbar.bottom - (display.bounds.y + display.bounds.height)) < 12;
  const isTop = Math.abs(taskbar.top - display.bounds.y) < 12;
  const isHorizontal = isBottom || isTop;
  if (!isHorizontal) return false;

  const realTaskButtons = Array.isArray(layout.taskButtons) ? layout.taskButtons : [];
  let appButtons = realTaskButtons
    .filter(b => {
      if (b.ProcessId === process.pid) return false;
      const name = b.Name || '';
      if (name.includes('帕帕') || name.includes('小南瓜') || name.includes('照料') || name.includes('专注') || name.includes('圣域') || name.includes('LIVE')) return false;
      return true;
    })
    .map(b => pointToElectronSpace(b, display, rawTaskbar));

  // 若 UIAutomation 未获取到独立按钮（如 Win10 经典任务栏），不要把整个 taskList 塞进 appButtons 当成单个图标
  if (appButtons.length === 0) {
    if (layout.taskList && layout.taskList.Right > layout.taskList.Left) {
      const taskListRect = pointToElectronSpace(layout.taskList, display, rawTaskbar);
      const estimatedRight = Math.min(taskListRect.right, taskListRect.left + 320);
      appButtons.push({ left: taskListRect.left, right: estimatedRight, top: taskListRect.top, bottom: taskListRect.bottom });
    } else if (layout.taskSwitch && layout.taskSwitch.Right > layout.taskSwitch.Left) {
      const taskSwitchRect = pointToElectronSpace(layout.taskSwitch, display, rawTaskbar);
      const estimatedRight = Math.min(taskSwitchRect.right, taskSwitchRect.left + 320);
      appButtons.push({ left: taskSwitchRect.left, right: estimatedRight, top: taskSwitchRect.top, bottom: taskSwitchRect.bottom });
    }
  }

  const wings = calculateTaskbarWings(taskbar, tray, appButtons);
  const height = Math.max(34, taskbar.bottom - taskbar.top);
  const y = taskbar.top;

  if (wings.mode === 'dual') {
    // 居中/双翼模式：双槽位同时展示！
    // 1. 右翼主挂件
    win.setMinimumSize(120, 32);
    win.setResizable(false);
    win.setBounds({ x: wings.right.x, y, width: wings.right.width, height }, true);
    if (!win.isVisible()) win.showInactive();
    win.setAlwaysOnTop(true, 'screen-saver');
    if (!win.webContents.isDestroyed()) {
      win.webContents.send('desktop:compact', true, 'right');
    }

    // 2. 左翼伴侣挂件
    const leftWin = makeLeftCompanionWindow();
    leftWin.setMinimumSize(120, 32);
    leftWin.setResizable(false);
    leftWin.setBounds({ x: wings.left.x, y, width: wings.left.width, height }, true);
    if (!leftWin.isVisible()) leftWin.showInactive();
    leftWin.setAlwaysOnTop(true, 'screen-saver');
    if (!leftWin.webContents.isDestroyed()) {
      leftWin.webContents.send('desktop:compact', true, 'left');
    }
  } else {
    // 靠左单槽位模式（Windows 10 或靠左对齐）：单个挂件平铺在可用区域
    win.setMinimumSize(120, 32);
    win.setResizable(false);
    win.setBounds({ x: wings.single.x, y, width: wings.single.width, height }, true);
    if (!win.isVisible()) win.showInactive();
    win.setAlwaysOnTop(true, 'screen-saver');
    if (!win.webContents.isDestroyed()) {
      win.webContents.send('desktop:compact', true, 'unified');
    }
    if (leftCompanionWin && !leftCompanionWin.isDestroyed()) {
      leftCompanionWin.hide();
    }
  }

  return true;
}

function makeWindow() {
  const iconPath = getAppIconPath();
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 700,
    minHeight: 480,
    frame: false,
    transparent: true,
    resizable: true,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setResizable(true);

  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });
}

async function toggleCompact(force) {
  compact = typeof force === 'boolean' ? force : !compact;
  if (!win) return compact;
  if (compact) {
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setSkipTaskbar(true);
    try { win.setFocusable(false); } catch {}
    const placed = await placeInTaskbarGap();
    if (!placed) {
      const { workArea } = screen.getPrimaryDisplay();
      win.setBounds({ x: workArea.x + workArea.width - 360, y: workArea.y + workArea.height - 42, width: 350, height: 38 }, true);
    }
  } else {
    compactBounds = '';
    if (leftCompanionWin && !leftCompanionWin.isDestroyed()) {
      leftCompanionWin.hide();
    }
    try { win.setFocusable(true); } catch {}
    win.setAlwaysOnTop(false);
    win.setSkipTaskbar(false);
    win.setResizable(true);
    win.setMinimumSize(700, 480);
    win.setSize(1360, 860, true);
    win.center();
    if (!win.webContents.isDestroyed()) win.webContents.send('desktop:compact', false, 'full');
  }
  return compact;
}

function toggleBossKey() {
  isBossHidden = !isBossHidden;
  if (isBossHidden) {
    if (win && !win.isDestroyed()) win.hide();
    if (leftCompanionWin && !leftCompanionWin.isDestroyed()) leftCompanionWin.hide();
  } else {
    if (win && !win.isDestroyed()) {
      win.show();
      if (compact) {
        placeInTaskbarGap();
      }
    }
  }
  return isBossHidden;
}

function makeTray() {
  if (tray && !tray.isDestroyed()) return;
  const iconPath = getAppIconPath();
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('帕帕 & 小南瓜 · 湖畔圣域');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示庭院', click: () => { if (isBossHidden) toggleBossKey(); else { win.show(); win.focus(); toggleCompact(false); } } },
    { label: '切换任务栏挂件', click: () => { if (isBossHidden) toggleBossKey(); else { win.show(); toggleCompact(); } } },
    { type: 'separator' },
    { label: '老板键 (Alt+W)', click: () => toggleBossKey() },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', () => {
    if (isBossHidden) toggleBossKey();
    else { win.show(); win.focus(); }
  });
}

function startKeyListener() {
  if (process.platform !== 'win32') return;
  const source = path.join(__dirname, 'key-listener.ps1');
  const target = path.join(app.getPath('userData'), 'key-listener.ps1');
  try {
    const script = fs.readFileSync(source, 'utf8');
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== script) {
      fs.writeFileSync(target, script, 'utf8');
    }
    keyListenerProc = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', target
    ], { windowsHide: true });

    keyListenerProc.stdout?.on('data', (data) => {
      const text = data.toString();
      const count = (text.match(/K/g) || []).length;
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          if (win && !win.isDestroyed()) win.webContents.send('desktop:keydown');
          if (leftCompanionWin && !leftCompanionWin.isDestroyed()) leftCompanionWin.webContents.send('desktop:keydown');
        }
      }
    });

    keyListenerProc.on('error', () => {});
  } catch (err) {}
}

function reassertTopmost() {
  if (!compact || isBossHidden) return;
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(true, 'screen-saver');
    try { win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch {}
  }
  if (leftCompanionWin && !leftCompanionWin.isDestroyed()) {
    leftCompanionWin.setAlwaysOnTop(true, 'screen-saver');
    try { leftCompanionWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch {}
  }
}

app.whenReady().then(() => {
  makeWindow();
  makeTray();
  startKeyListener();
  initAutoUpdater();

  try {
    globalShortcut.register('Alt+W', () => {
      toggleBossKey();
    });
  } catch (err) {
    console.error('Failed to register Boss Key Alt+W:', err);
  }

  // 极速心跳：确保被任务栏点击时 0 延迟保持最顶层
  setInterval(() => {
    if (compact && !isBossHidden) {
      reassertTopmost();
    }
  }, 1200);

  // 定期检测任务栏应用图标增删自适应重排
  setInterval(() => { if (compact && !isBossHidden) placeInTaskbarGap(); }, 12000);
  screen.on('display-metrics-changed', () => { if (compact && !isBossHidden) placeInTaskbarGap(); });
  app.on('browser-window-blur', () => {
    setTimeout(reassertTopmost, 30);
  });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) makeWindow(); else win.show(); });
});

let isModalExpanded = false;
let savedCompactBounds = null;

async function setModalActive(isOpen) {
  if (!win || win.isDestroyed()) return;
  if (!compact) return; // 全屏/桌面大窗模式下弹窗在窗口内正常居中，无需调整外壳
  isModalExpanded = Boolean(isOpen);
  if (isOpen) {
    try { win.setFocusable(true); } catch {}
    const current = win.getBounds();
    // 仅在初次从紧凑状态弹出时记录原始坐标，避免连续打开二级弹窗覆盖原始紧凑高度
    if (!savedCompactBounds || savedCompactBounds.height > 60) {
      if (current.height <= 60) {
        savedCompactBounds = { ...current };
      }
    }
    const { workArea } = screen.getDisplayMatching(current);

    const targetW = 560;
    const targetH = 600;

    let targetX = current.x + (current.width - targetW) / 2;
    targetX = Math.max(workArea.x + 8, Math.min(workArea.x + workArea.width - targetW - 8, targetX));
    const targetY = Math.max(workArea.y + 8, current.y + current.height - targetH);

    win.setResizable(true);
    win.setMinimumSize(320, 200);
    win.setBounds({
      x: Math.round(targetX),
      y: Math.round(targetY),
      width: targetW,
      height: targetH
    }, false);
    win.setAlwaysOnTop(true, 'screen-saver');
    win.show();
    win.focus();
  } else {
    // 弹窗关闭：可靠重新对齐并收回为任务栏全景水道
    win.setMinimumSize(120, 32);
    win.setResizable(false);
    savedCompactBounds = null;
    try { win.setFocusable(false); } catch {}
    await placeInTaskbarGap();
    win.setAlwaysOnTop(true, 'screen-saver');
  }
}

ipcMain.handle('desktop:toggle-compact', (_, value) => toggleCompact(value));
ipcMain.handle('desktop:set-always-on-top', (_, value) => { win?.setAlwaysOnTop(Boolean(value), 'floating'); return Boolean(value); });
ipcMain.handle('desktop:toggle-boss-key', () => toggleBossKey());
ipcMain.handle('desktop:set-modal-active', (_, isOpen) => setModalActive(isOpen));
ipcMain.handle('desktop:minimize', () => win?.minimize());
ipcMain.handle('desktop:maximize', () => {
  if (!win) return false;
  if (win.isMaximized()) {
    win.unmaximize();
    return false;
  } else {
    win.maximize();
    return true;
  }
});
ipcMain.handle('desktop:close', () => win?.close());
ipcMain.on('desktop:drag', () => win?.startDrag?.());

// --- 自动更新机制 (GitHub Releases OTA Auto-Update) ---
let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (e) {
  console.log('electron-updater not available in environment:', e.message);
}

function initAutoUpdater() {
  if (!autoUpdater) return;
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    console.log('[AutoUpdater] Skip auto-check in development mode.');
    return;
  }

  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'ju5202',
      repo: 'papa-xiaolangua'
    });
  } catch (err) {
    console.log('[AutoUpdater] setFeedURL error:', err.message);
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates on GitHub...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    if (win && !win.isDestroyed()) {
      win.webContents.send('desktop:update-message', {
        status: 'available',
        version: info.version,
        releaseNotes: info.releaseNotes || '带来全新圣域装饰、小乌龟形象与修复！'
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] App is up to date.');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('desktop:update-message', {
        status: 'downloading',
        percent: Math.round(progressObj.percent)
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    if (win && !win.isDestroyed()) {
      win.webContents.send('desktop:update-message', {
        status: 'downloaded',
        version: info.version
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error checking/downloading update:', err?.message || err);
    if (win && !win.isDestroyed()) {
      win.webContents.send('desktop:update-message', {
        status: 'error',
        message: err?.message
      });
    }
  });

  // 延迟 4 秒执行检查，确保界面与任务栏水渠先就绪
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.log('[AutoUpdater] Check failed:', err?.message);
    });
  }, 4000);
}

ipcMain.handle('desktop:check-for-updates', async () => {
  if (!autoUpdater || !app.isPackaged) return { status: 'dev_mode' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', updateInfo: result?.updateInfo };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('desktop:restart-and-update', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
  }
});

ipcMain.on('desktop:quantum-dive', (event, data) => {
  if (win && !win.isDestroyed() && event.sender !== win.webContents) {
    win.webContents.send('desktop:quantum-dive', data);
  }
  if (leftCompanionWin && !leftCompanionWin.isDestroyed() && event.sender !== leftCompanionWin.webContents) {
    leftCompanionWin.webContents.send('desktop:quantum-dive', data);
  }
});

ipcMain.on('desktop:sync-state', (event, data) => {
  if (win && !win.isDestroyed() && event.sender !== win.webContents) {
    win.webContents.send('desktop:sync-state', data);
  }
  if (leftCompanionWin && !leftCompanionWin.isDestroyed() && event.sender !== leftCompanionWin.webContents) {
    leftCompanionWin.webContents.send('desktop:sync-state', data);
  }
});

app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch {}
});

app.on('before-quit', () => {
  try { keyListenerProc?.kill(); } catch {}
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});
