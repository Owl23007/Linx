import { setupDragHandlers } from '../ipc/dragHandler.js';
import { setupEasyTierHandlers } from '../ipc/easytierHandler.js';
import { setupUserHandlers } from '../ipc/userHandler.js';
import { setupWindowHandlers } from '../ipc/windowsHandler.js';

class IpcManager {
  constructor(windowManager, easyTierManager, databaseManager) {
    this.windowManager = windowManager;
    this.easyTierManager = easyTierManager;
    this.databaseManager = databaseManager;
  }

  /**
   * 设置所有 IPC 处理器
   */
  setupHandlers() {
    setupWindowHandlers(this.windowManager);
    setupDragHandlers();
    setupUserHandlers(this.databaseManager);
    setupEasyTierHandlers(this.easyTierManager);
  }
}

export default IpcManager;
