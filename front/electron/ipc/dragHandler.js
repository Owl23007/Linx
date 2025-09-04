import { ipcMain } from 'electron';

export function setupDragHandlers() {
  // 获取窗口边界信息
  ipcMain.handle('drag:getBounds', (event) => {
    const win = event.sender.getOwnerBrowserWindow();

    return win ? win.getBounds() : null;
  });

  // 设置窗口位置
  ipcMain.on('drag:setBounds', (event, x, y, width, height) => {
    const win = event.sender.getOwnerBrowserWindow();
    if (win && !win.isDestroyed()) {
      try {
        // 不用 setPosition 是因为 https://github.com/electron/electron/issues/9477
        win.setBounds({
          x: Math.round(x),
          y: Math.round(y),
          width,
          height,
        });
      } catch {
        // 忽略错误
      }
    }
  });
}
