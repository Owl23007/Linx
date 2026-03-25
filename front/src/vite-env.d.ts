/// <reference types="vite-plus/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;

  export default component;
}

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
