import { setupDragHandlers } from '../ipc/dragHandler.js';
import { setupWindowHandlers } from '../ipc/windowsHandler.js';

class IpcManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
  }

  /**
   * 设置所有 IPC 处理器
   */
  setupHandlers() {
    setupWindowHandlers(this.windowManager);
    setupDragHandlers();

    // 设置用户相关处理器
    // setupUserIpcHandlers();
  }
}

export default IpcManager;
