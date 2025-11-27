import { getElectronApi, type IpcResponse } from '../utils/electron';

export interface EasyTierConfig {
  networkName: string;
  networkSecret: string;
  peers?: string[];
  hostname?: string;
  ipv4?: string;
  dhcp?: boolean;
  listeners?: string[];
  rpcPort?: number;
  devName?: string;
  defaultProtocol?: string;
  multiThread?: boolean;
  latencyFirst?: boolean;
  useSmoltcp?: boolean;
  relayAllPeerRpc?: boolean;
  fileLogLevel?: string;
  fileLogDir?: string;
  enableQuicProxy?: boolean;
  privateMode?: boolean;
  disableP2p?: boolean;
  disableEncryption?: boolean;
  disableIpv6?: boolean;
  noTun?: boolean;
}

export interface EasyTierStatus {
  running: boolean;
  pid: number | null;
}

export const easyTierService = {
  async start(config: EasyTierConfig): Promise<IpcResponse<void>> {
    const api = getElectronApi();
    if (!api) return { success: false, data: undefined, error: 'Not in Electron environment' };

    return await api.invoke('easytier:start', config);
  },

  async stop(): Promise<IpcResponse<void>> {
    const api = getElectronApi();
    if (!api) return { success: false, data: undefined, error: 'Not in Electron environment' };

    return await api.invoke('easytier:stop');
  },

  async getStatus(): Promise<IpcResponse<EasyTierStatus>> {
    const api = getElectronApi();
    if (!api) return { success: false, data: { running: false, pid: null }, error: 'Not in Electron environment' };
    const status = await api.invoke('easytier:status');

    return { success: true, data: status };
  },

  async getPeers(): Promise<IpcResponse<any[]>> {
    const api = getElectronApi();
    if (!api) return { success: false, data: [], error: 'Not in Electron environment' };

    return await api.invoke('easytier:getPeers');
  }
};
