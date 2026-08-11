const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sanctuaryDesktop', {
  toggleCompact: (value) => ipcRenderer.invoke('desktop:toggle-compact', value),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('desktop:set-always-on-top', value),
  onCompactChanged: (callback) => ipcRenderer.on('desktop:compact', (_, value) => callback(value))
});
