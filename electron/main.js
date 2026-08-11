const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');

let win;
let tray;
let compact = false;

function makeWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 700,
    minHeight: 480,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });
}

function toggleCompact(force) {
  compact = typeof force === 'boolean' ? force : !compact;
  if (!win) return compact;
  if (compact) {
    const { workArea } = screen.getPrimaryDisplay();
    win.setAlwaysOnTop(true, 'floating');
    win.setSize(640, 170, true);
    win.setPosition(Math.round(workArea.x + (workArea.width - 660) / 2), workArea.y + workArea.height - 195, true);
  } else {
    win.setAlwaysOnTop(false);
    win.setSize(1360, 860, true);
    win.center();
  }
  win.webContents.send('desktop:compact', compact);
  return compact;
}

function makeTray() {
  // A transparent 16px icon keeps the tray usable without bundling binary assets.
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('帕帕 & 小南瓜 · 湖畔圣域');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示庭院', click: () => { win.show(); win.focus(); toggleCompact(false); } },
    { label: '切换任务栏挂件', click: () => { win.show(); toggleCompact(); } },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', () => { win.show(); win.focus(); });
}

app.whenReady().then(() => {
  makeWindow();
  makeTray();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) makeWindow(); else win.show(); });
});

ipcMain.handle('desktop:toggle-compact', (_, value) => toggleCompact(value));
ipcMain.handle('desktop:set-always-on-top', (_, value) => { win?.setAlwaysOnTop(Boolean(value), 'floating'); return Boolean(value); });
ipcMain.on('desktop:drag', () => win?.startDrag?.());

app.on('window-all-closed', (event) => {
  event.preventDefault();
});
