import { type Ref, ref, watch } from 'vue';

/**
 * 防抖 Hook
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * 节流 Hook
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * 防抖值 Hook
 * @param value 响应式值
 * @param delay 延迟时间（毫秒）
 */
export function useDebouncedValue<T>(value: Ref<T>, delay = 300) {
  const debouncedValue = ref(value.value) as Ref<T>;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  watch(value, (newValue) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

/**
 * 加载状态 Hook
 */
export function useLoading(initialState = false) {
  const loading = ref(initialState);

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true;
    try {
      return await fn();
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    withLoading,
  };
}

/**
 * 异步数据 Hook
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options?: {
    immediate?: boolean;
    initialData?: T;
  }
) {
  const data = ref<T | undefined>(options?.initialData) as Ref<T | undefined>;
  const error = ref<Error | null>(null);
  const loading = ref(false);

  async function execute() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fetcher();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  if (options?.immediate !== false) {
    execute();
  }

  return {
    data,
    error,
    loading,
    execute,
    refresh: execute,
  };
}

/**
 * 剪贴板 Hook
 */
export function useClipboard() {
  const supported = ref(!!navigator.clipboard);

  async function copy(text: string): Promise<boolean> {
    if (!supported.value) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);

      return true;
    } catch {
      return false;
    }
  }

  async function read(): Promise<string> {
    if (!supported.value) {
      return '';
    }

    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }

  return {
    supported,
    copy,
    read,
  };
}

/**
 * 本地存储 Hook
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue);

  // 从本地存储读取
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      data.value = JSON.parse(stored);
    }
  } catch {
    // 读取失败，使用默认值
  }

  // 监听变化并保存
  watch(
    data,
    (newValue) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // 保存失败
      }
    },
    { deep: true }
  );

  return data;
}

/**
 * 会话存储 Hook
 */
export function useSessionStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue);

  // 从会话存储读取
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      data.value = JSON.parse(stored);
    }
  } catch {
    // 读取失败，使用默认值
  }

  // 监听变化并保存
  watch(
    data,
    (newValue) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // 保存失败
      }
    },
    { deep: true }
  );

  return data;
}
