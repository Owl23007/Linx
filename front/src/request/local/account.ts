import { getElectronApi } from '@/utils/electron';

/**
 * 获取本地保存的账号列表
 */
export async function getSavedAccounts(): Promise<any[]> {
  const api = getElectronApi();
  if (!api) return [];

  return await api.getAccounts();
}

/**
 * 保存账号信息到本地
 */
export async function saveAccount(account: any): Promise<void> {
  const api = getElectronApi();
  if (!api) return;
  await api.saveAccount(account);
}

/**
 * 删除本地账号
 */
export async function deleteAccount(account: { server_url: string; username: string }): Promise<void> {
  const api = getElectronApi();
  if (!api) return;
  await api.deleteAccount(account);
}
