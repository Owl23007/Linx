/**
 * Electron 通用工具 - 统一的 Electron API 封装
 */

// 定义 ElectronApi 接口类型
interface ElectronApi {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, callback: (...args: any[]) => void) => (() => void)
  removeListener: (channel: string, callback: (...args: any[]) => void) => void

  // Account Management
  saveAccount: (userData: any) => Promise<any>
  getAccounts: () => Promise<any[]>
  deleteAccount: (accountInfo: any) => Promise<any>
}

// 通用 IPC 响应接口
export interface IpcResponse<T = any> {
  success: boolean
  data: T
  error?: string
}

// 分页信息接口
export interface PaginationInfo {
  page: number
  limit: number
  total: number
}

// 带分页的 IPC 响应接口
export interface IpcPaginatedResponse<T = any> extends IpcResponse<T> {
  pagination?: PaginationInfo
}

/**
 * 获取 Electron API 对象
 */
export function getElectronApi(): ElectronApi | undefined {
  return (window as any).electronApi as ElectronApi | undefined;
}

/**
 * 检查是否在 Electron 环境中
 */
export function isElectron(): boolean {
  const electronApi = getElectronApi();

  return !!(electronApi && typeof electronApi === 'object');
}

/**
 * 安全的 IPC 调用封装
 * @param channel IPC 通道名称
 * @param args 参数
 * @returns IPC 响应
 */
export async function invokeIpc<T = any>(channel: string, ...args: any[]): Promise<IpcResponse<T>> {
  try {
    const electronApi = getElectronApi();
    if (!electronApi) {
      return {
        success: false,
        data: null as T,
        error: 'ElectronAPI 不可用'
      };
    }

    const result = await electronApi.invoke(channel, ...args);

    return result || {
      success: false,
      data: null as T,
      error: '调用返回空结果'
    };
  } catch (error) {
    return {
      success: false,
      data: null as T,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 带分页的 IPC 调用封装
 * @param channel IPC 通道名称
 * @param page 页码
 * @param limit 每页数量
 * @param otherArgs 其他参数
 * @returns 带分页的 IPC 响应
 */
export async function invokeIpcPaginated<T = any>(
  channel: string,
  page = 1,
  limit = 20,
  ...otherArgs: any[]
): Promise<IpcPaginatedResponse<T>> {
  try {
    const electronApi = getElectronApi();
    if (!electronApi) {
      return {
        success: false,
        data: null as T,
        pagination: { page, limit, total: 0 },
        error: 'ElectronAPI 不可用'
      };
    }

    const result = await electronApi.invoke(channel, page, limit, ...otherArgs);

    return result || {
      success: false,
      data: null as T,
      pagination: { page, limit, total: 0 },
      error: '调用返回空结果'
    };
  } catch (error) {
    return {
      success: false,
      data: null as T,
      pagination: { page, limit, total: 0 },
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 发送 IPC 消息（不等待响应）
 * @param channel IPC 通道名称
 * @param args 参数
 */
export function sendIpc(channel: string, ...args: any[]): void {
  const electronApi = getElectronApi();
  if (electronApi) {
    electronApi.send(channel, ...args);
  }
}

/**
 * 监听 IPC 消息
 * @param channel IPC 通道名称
 * @param callback 回调函数
 * @returns 取消监听的函数
 */
export function onIpc(channel: string, callback: (...args: any[]) => void): (() => void) | undefined {
  const electronApi = getElectronApi();
  if (electronApi) {
    return electronApi.on(channel, callback);
  }

  return undefined;
}

/**
 * 移除 IPC 监听器
 * @param channel IPC 通道名称
 * @param callback 回调函数
 */
export function removeIpcListener(channel: string, callback: (...args: any[]) => void): void {
  const electronApi = getElectronApi();
  if (electronApi) {
    electronApi.removeListener(channel, callback);
  }
}

/**
 * 通过 Electron 的 IPC 关闭窗口
 */
export function closeWindow() {
  if (isElectron()) {
    sendIpc('close-window');
  } else {
    // fallback: 兼容非 electron 环境
    if (typeof window.close === 'function') {
      window.close();
    }
  }
}

/**
 * 通过 Electron 的 IPC 最小化窗口
 */
export function minimizeWindow() {
  if (isElectron()) {
    sendIpc('minimize-window');
  }
}

/**
 * 通过 Electron 的 IPC 最大化/还原窗口
 */
export function maximizeWindow() {
  if (isElectron()) {
    sendIpc('maximize-window');
  }
}

/**
 * 获取窗口最大化状态
 */
export async function getWindowMaximized(): Promise<boolean> {
  if (isElectron()) {
    const res = await invokeIpc<boolean>('get-window-maximized');

    return res.data;
  }

  return false;
}

/**
 * 监听窗口最大化状态变化
 * @param callback 回调函数
 * @returns 取消监听的函数
 */
export function onWindowMaximizedStateChanged(callback: (isMaximized: boolean) => void): (() => void) | undefined {
  return onIpc('window-maximized-state-changed', callback);
}
