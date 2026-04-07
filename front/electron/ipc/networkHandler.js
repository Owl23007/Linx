import { ipcMain, session } from 'electron';

const defaultProxyConfig = {
  enabled: false,
  protocol: 'http',
  host: '',
  port: '',
  username: '',
  password: '',
  bypass: '<local>'
};

let currentProxyConfig = { ...defaultProxyConfig };

function buildProxyRules(config) {
  const protocol = config.protocol || 'http';
  const username = config.username?.trim();
  const password = config.password?.trim();
  const host = config.host?.trim();
  const port = String(config.port || '').trim();

  if (!host || !port) {
    throw new Error('代理地址和端口不能为空');
  }

  const authPart = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password || '')}@`
    : '';

  return `${protocol}://${authPart}${host}:${port}`;
}

export function setupNetworkHandlers() {
  ipcMain.handle('network:set-proxy', async (event, rawConfig = {}) => {
    try {
      const nextConfig = {
        ...defaultProxyConfig,
        ...rawConfig
      };

      if (!nextConfig.enabled) {
        await session.defaultSession.setProxy({ mode: 'direct' });
        currentProxyConfig = { ...defaultProxyConfig };

        return { success: true, data: currentProxyConfig };
      }

      const proxyRules = buildProxyRules(nextConfig);
      const proxyBypassRules = (nextConfig.bypass || '<local>').trim();

      await session.defaultSession.setProxy({
        proxyRules,
        proxyBypassRules
      });

      currentProxyConfig = {
        ...nextConfig,
        host: nextConfig.host.trim(),
        port: String(nextConfig.port).trim(),
        username: nextConfig.username?.trim() || '',
        password: nextConfig.password?.trim() || '',
        bypass: proxyBypassRules
      };

      return { success: true, data: currentProxyConfig };
    } catch (error) {
      return { success: false, error: error.message || '设置网络代理失败' };
    }
  });

  ipcMain.handle('network:get-proxy', async () => {
    return { success: true, data: currentProxyConfig };
  });
}
