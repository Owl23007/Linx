import { ipcMain } from 'electron';

export function setupWindowHandlers(windowManager) {
  // 关闭窗口
  ipcMain.on('close-window', () => {
    windowManager.closeMainWindow();
  });

  // 最小化窗口
  ipcMain.on('minimize-window', () => {
    windowManager.minimizeMainWindow();
  });

  // 最大化/还原窗口
  ipcMain.on('maximize-window', () => {
    windowManager.toggleMaximizeMainWindow();
  });

  // 切换为主窗口
  ipcMain.on('set-main-window', () => {
    windowManager.switchToMainWindow();
  });
}
