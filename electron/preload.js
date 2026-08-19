const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sanctuaryDesktop', {
  toggleCompact: (value) => ipcRenderer.invoke('desktop:toggle-compact', value),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('desktop:set-always-on-top', value),
  minimize: () => ipcRenderer.invoke('desktop:minimize'),
  maximize: () => ipcRenderer.invoke('desktop:maximize'),
  close: () => ipcRenderer.invoke('desktop:close'),
  toggleBossKey: () => ipcRenderer.invoke('desktop:toggle-boss-key'),
  setModalActive: (isOpen) => ipcRenderer.invoke('desktop:set-modal-active', isOpen),
  sendQuantumDive: (data) => ipcRenderer.send('desktop:quantum-dive', data),
  onQuantumDive: (callback) => ipcRenderer.on('desktop:quantum-dive', (_, data) => callback(data)),
  sendSyncState: (data) => ipcRenderer.send('desktop:sync-state', data),
  onSyncState: (callback) => ipcRenderer.on('desktop:sync-state', (_, data) => callback(data)),
  onCompactChanged: (callback) => ipcRenderer.on('desktop:compact', (_, value, mode) => callback(value, mode)),
  onGlobalKeydown: (callback) => ipcRenderer.on('desktop:keydown', () => callback()),
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-for-updates'),
  restartAndUpdate: () => ipcRenderer.invoke('desktop:restart-and-update'),
  onUpdateMessage: (callback) => ipcRenderer.on('desktop:update-message', (_, data) => callback(data))
});
