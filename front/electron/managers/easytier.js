import { spawn } from 'child_process';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/log.js';

class EasyTierManager {
  constructor() {
    this.process = null;
    this.binPath = this.getBinPath();
    this.rpcPort = 11010;
  }

  getBinPath() {
    const isDev = !app.isPackaged;
    const binName = process.platform === 'win32' ? 'easytier-core.exe' : 'easytier-core';
    if (isDev) {
      return path.join(process.cwd(), 'electron', 'bin', 'easytier', binName);
    } else {
      return path.join(process.resourcesPath, 'bin', 'easytier', binName);
    }
  }

  getCliPath() {
    const isDev = !app.isPackaged;
    const binName = process.platform === 'win32' ? 'easytier-cli.exe' : 'easytier-cli';
    if (isDev) {
      return path.join(process.cwd(), 'electron', 'bin', 'easytier', binName);
    } else {
      return path.join(process.resourcesPath, 'bin', 'easytier', binName);
    }
  }

  async init() {
    if (!fs.existsSync(this.binPath)) {
      logger.error('EASYTIER', `Binary not found at ${this.binPath}`);
    } else {
      logger.info('EASYTIER', `Binary found at ${this.binPath}`);
    }
  }

  start(config) {
    if (this.process) {
      logger.warn('EASYTIER', 'Process already running');

      return false;
    }

    if (!fs.existsSync(this.binPath)) {
      throw new Error(`EasyTier binary not found at ${this.binPath}`);
    }

    // Construct args from config
    const args = [];

    // DHCP (using -d as per user request)
    if (config.dhcp) {
      args.push('-d');
    }

    if (config.hostname) {
      args.push('--hostname', config.hostname);
    }

    if (config.networkName) {
      args.push('--network-name', config.networkName);
    }
    if (config.networkSecret) {
      args.push('--network-secret', config.networkSecret);
    }

    if (config.peers && Array.isArray(config.peers)) {
      config.peers.forEach(p => {
        args.push('--peers', p);
      });
    }

    // Default Protocol
    if (config.defaultProtocol) {
      args.push('--default-protocol', config.defaultProtocol);
    }

    // Listeners
    if (config.listeners && Array.isArray(config.listeners)) {
      config.listeners.forEach(l => {
        args.push('-l', l);
      });
    }

    // IPv4
    if (config.ipv4) {
      args.push('--ipv4', config.ipv4);
    }

    // Multi-thread
    if (config.multiThread) {
      args.push('--multi-thread');
    }

    // Latency First
    if (config.latencyFirst) {
      args.push('--latency-first');
    }

    // Use Smoltcp
    if (config.useSmoltcp) {
      args.push('--use-smoltcp');
    }

    // Relay All Peer RPC
    if (config.relayAllPeerRpc) {
      args.push('--relay-all-peer-rpc');
    }

    // File Log Level
    if (config.fileLogLevel) {
      args.push('--file-log-level', config.fileLogLevel);
    }

    // File Log Dir
    if (config.fileLogDir) {
      args.push('--file-log-dir', config.fileLogDir);
    }

    // Dev Name
    if (config.devName) {
      args.push('--dev-name', config.devName);
    }

    // Enable QUIC Proxy
    if (config.enableQuicProxy) {
      args.push('--enable-quic-proxy');
    }

    // Private Mode
    if (config.privateMode) {
      args.push('--private-mode');
    }

    // Disable P2P (Force Relay)
    if (config.disableP2p) {
      args.push('--disable-p2p');
    }

    // Disable Encryption
    if (config.disableEncryption) {
      args.push('--disable-encryption');
    }

    // Disable IPv6
    if (config.disableIpv6) {
      args.push('--disable-ipv6');
    }

    // No Tun
    if (config.noTun) {
      args.push('--no-tun');
    }

    // RPC Port
    if (config.rpcPort) {
      this.rpcPort = config.rpcPort;
      // Force binding to 127.0.0.1 to ensure CLI can connect and for security
      // The UI only provides a number, so we assume localhost
      args.push('--rpc-portal', `127.0.0.1:${config.rpcPort}`);
    } else {
      this.rpcPort = 11010;
    }

    // 默认参数
    // -d (daemon) 不需要，因为我们是用 spawn 管理子进程

    logger.info('EASYTIER', `Starting EasyTier with args: ${args.join(' ')}`);

    try {
      this.process = spawn(this.binPath, args);

      this.process.stdout.on('data', (data) => {
        logger.info('EASYTIER_STDOUT', data.toString());
      });

      this.process.stderr.on('data', (data) => {
        logger.error('EASYTIER_STDERR', data.toString());
      });

      this.process.on('close', (code) => {
        logger.info('EASYTIER', `Process exited with code ${code}`);
        this.process = null;
      });

      return true;
    } catch (e) {
      logger.error('EASYTIER', `Failed to start process: ${e.message}`);
      throw e;
    }
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      logger.info('EASYTIER', 'Process stopped');

      return true;
    }

    return false;
  }

  getStatus() {
    return {
      running: !!this.process,
      pid: this.process ? this.process.pid : null
    };
  }

  async getPeers() {
    if (!this.process) {
      throw new Error('EasyTier is not running');
    }

    const cliPath = this.getCliPath();
    if (!fs.existsSync(cliPath)) {
      throw new Error('EasyTier CLI not found');
    }

    return new Promise((resolve, reject) => {
      // Options must come before the command
      const args = ['-o', 'json'];
      if (this.rpcPort) {
        // CLI expects a socket address (e.g., 127.0.0.1:11010)
        args.push('-p', `127.0.0.1:${this.rpcPort}`);
      }
      args.push('peer');

      const child = spawn(cliPath, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`CLI exited with code ${code}: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse CLI output: ${e.message}`));
          }
        }
      });
    });
  }

  async getRoute() {
    if (!this.process) {
      throw new Error('EasyTier is not running');
    }

    const cliPath = this.getCliPath();
    if (!fs.existsSync(cliPath)) {
      throw new Error('EasyTier CLI not found');
    }

    return new Promise((resolve, reject) => {
      const args = ['-o', 'json'];
      if (this.rpcPort) {
        args.push('-p', `127.0.0.1:${this.rpcPort}`);
      }
      args.push('route');

      const child = spawn(cliPath, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`CLI exited with code ${code}: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse CLI output: ${e.message}`));
          }
        }
      });
    });
  }
}

export default EasyTierManager;
