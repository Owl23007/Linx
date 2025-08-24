// 声明 electronApi 类型
declare global {
  interface Window {
    electronApi?: {
      closeWindow: () => void
      minimizeWindow: () => void
      maximizeWindow: () => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}



/**
 * 检查是否在 Electron 环境中
 */
export function isElectron(): boolean {
  return !!(window.electronApi && typeof window.electronApi === 'object');
}

/**
 * 通过 Electron 的 window.electronApi 关闭窗口
 */
export function closeWindow() {
  if (window.electronApi && window.electronApi.closeWindow) {
    window.electronApi.closeWindow();
  } else {
    // fallback: 兼容非 electron 环境
    if (typeof window.close === 'function') {
      window.close();
    }
  }
}

/**
 * 通过 Electron 的 window.electronApi 最小化窗口
 */
export function minimizeWindow() {
  if (window.electronApi && window.electronApi.minimizeWindow) {
    window.electronApi.minimizeWindow();
  }
}

/**
 * 通过 Electron 的 window.electronApi 最大化/还原窗口
 */
export function maximizeWindow() {
  if (window.electronApi && window.electronApi.maximizeWindow) {
    window.electronApi.maximizeWindow();
  }
}
