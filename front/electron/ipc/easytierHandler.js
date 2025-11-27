import { ipcMain } from 'electron';

export function setupEasyTierHandlers(easyTierManager) {
  ipcMain.handle('easytier:start', async (event, config) => {
    try {
      const success = easyTierManager.start(config);

      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('easytier:stop', async () => {
    try {
      const success = easyTierManager.stop();

      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('easytier:status', async () => {
    return easyTierManager.getStatus();
  });

  ipcMain.handle('easytier:getPeers', async () => {
    try {
      const peers = await easyTierManager.getPeers();

      return { success: true, data: peers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
