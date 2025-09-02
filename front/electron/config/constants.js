/**
 * 应用常量配置
 */

// 窗口配置
const WINDOW_CONFIG = {
  MAIN: {
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

// IPC 频道名称
const IPC_CHANNELS = {
  WINDOW: {
    CLOSE: 'close-window',
    MINIMIZE: 'minimize-window',
    MAXIMIZE: 'maximize-window',
  },
  DRAG: {
    GET_BOUNDS: 'drag:getBounds',
    SET_BOUNDS: 'drag:setBounds',
  },
  DATABASE: {
    INIT: 'db:init',
  },
};

// 应用信息
const APP_INFO = {
  NAME: 'Linx',
  VERSION: '1.0.0',
  DESCRIPTION: 'A modern communication application',
};

export {
  APP_INFO, IPC_CHANNELS, WINDOW_CONFIG
};
