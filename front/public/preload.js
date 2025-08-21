const { contextBridge, ipcRenderer } = require('electron')

/**
 *  将窗口控制功能暴露给渲染进程
 */
contextBridge.exposeInMainWorld('electronApi', {
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
})
