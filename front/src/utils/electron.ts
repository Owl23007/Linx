// 声明 electronApi 类型
declare global {
  interface Window {
    electronApi?: {
      closeWindow: () => void;
    };
  }
}

/**
 * 通过 Electron 的 contextBridge 预留的 window.electronApi 关闭窗口
 */
export function closeWindow() {
  if (window.electronApi && window.electronApi.closeWindow) {
    window.electronApi.closeWindow();
  } else {
    // fallback: 兼容非 electron 环境
    window.close && window.close();
  }
}
