// public/preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronApi', {
  closeWindow: () => ipcRenderer.send('close-window'),
})
