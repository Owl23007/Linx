const { contextBridge, ipcRenderer } = require('electron');

/**
 * 将窗口控制功能暴露给渲染进程
 */
contextBridge.exposeInMainWorld('electronApi', {
  // 窗口控制
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),

  // 通用 IPC 调用
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // 发送消息到主进程
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),

  // 监听主进程消息
  on: (channel, callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // 移除监听器
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
});
