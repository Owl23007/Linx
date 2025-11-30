/// <reference types="vite/client" />

export interface ElectronApi {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;

  // Account Management
  saveAccount: (userData: any) => Promise<any>;
  getAccounts: () => Promise<any[]>;
  deleteAccount: (accountInfo: any) => Promise<any>;
}

declare global {
  interface Window {
    electronApi?: ElectronApi;
  }
}
