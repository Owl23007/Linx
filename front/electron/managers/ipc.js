import { setupDragHandlers } from '../ipc/dragHandler.js';
import { setupEasyTierHandlers } from '../ipc/easytierHandler.js';
import { setupUserHandlers } from '../ipc/userHandler.js';
import { setupWindowHandlers } from '../ipc/windowsHandler.js';

class IpcManager {
  constructor(windowManager, easyTierManager) {
    this.windowManager = windowManager;
    this.easyTierManager = easyTierManager;
  }

  /**
   * 设置所有 IPC 处理器
   */
  setupHandlers(appDb) {
    setupWindowHandlers(this.windowManager);
    setupDragHandlers();
    setupUserHandlers(appDb);
    setupEasyTierHandlers(this.easyTierManager);
  }
}

export default IpcManager;
