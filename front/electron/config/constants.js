/**
 * 应用常量配置
 */

// 窗口配置
const WINDOW_CONFIG = {
  Auth: {
    width: 320,
    height: 450,
    minWidth: 320,
    minHeight: 450,
    frame: false,
    resizable: false,
    minimizable: true,
    maximizable: false,
    closable: true,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
  },
};

// 应用信息
const APP_INFO = {
  NAME: 'Linx',
  VERSION: '1.0.0',
  DESCRIPTION: 'A modern communication application',
};

export {
  APP_INFO, WINDOW_CONFIG
};
