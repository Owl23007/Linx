import { spawn, spawnSync } from 'child_process';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/log.js';

class EasyTierManager {
  constructor() {
    this.process = null;
    this.processPid = null;
    this.elevated = false;
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
      const error = new Error(`未找到 EasyTier 可执行文件: ${this.binPath}`);
      void logger.error('EASYTIER', error.message);
      throw error;
    }
    logger.info('EASYTIER', `找到可执行文件: ${this.binPath}`);
  }

  start(config) {
    if (this.isRunning()) {
      logger.warn('EASYTIER', '进程已在运行中');

      return false;
    }

    if (!fs.existsSync(this.binPath)) {
      throw new Error(`未找到 EasyTier 可执行文件: ${this.binPath}`);
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

    logger.info('EASYTIER', `正在启动 EasyTier，参数: ${args.join(' ')}`);

    if (process.platform === 'win32') {
      return this.startWindowsElevated(args);
    }

    try {
      this.process = spawn(this.binPath, args);
      this.processPid = this.process.pid ?? null;
      this.elevated = false;

      this.process.stdout.on('data', (data) => {
        logger.info('EASYTIER_STDOUT', data.toString().trim());
      });

      this.process.stderr.on('data', (data) => {
        void logger.error('EASYTIER_STDERR', data.toString().trim());
      });

      this.process.on('close', (code) => {
        logger.info('EASYTIER', `进程已退出，退出码: ${code}`);
        this.process = null;
        this.processPid = null;
        this.elevated = false;
      });

      return true;
    } catch (e) {
      void logger.error('EASYTIER', `启动进程失败: ${e.message}`);
      throw e;
    }
  }

  startWindowsElevated(args) {
    const toPsSingleQuoted = (value) => `'${String(value).replace(/'/g, "''")}'`;
    const argListLiteral = args.map(toPsSingleQuoted).join(', ');
    const script = `$argList = @(${argListLiteral}); $p = Start-Process -FilePath ${toPsSingleQuoted(this.binPath)} -ArgumentList $argList -Verb RunAs -WindowStyle Hidden -PassThru; Write-Output $p.Id`;

    const result = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-Command', script],
      { encoding: 'utf8' }
    );

    if (result.status !== 0) {
      const message = (result.stderr || result.stdout || '').trim() || '未知错误';
      if (/canceled|cancelled|已取消|拒绝|denied/i.test(message)) {
        throw new Error(`需要管理员权限启动 EasyTier（${message}）`);
      }
      throw new Error(`提权启动失败: ${message}`);
    }

    const output = (result.stdout || '').trim();
    const matchedPid = output.match(/(\d+)\s*$/);
    if (!matchedPid) {
      throw new Error(`提权启动成功但无法解析 PID: ${output}`);
    }

    this.process = null;
    this.processPid = Number(matchedPid[1]);
    this.elevated = true;
    logger.info('EASYTIER', `已通过 UAC 提权启动，PID: ${this.processPid}`);

    return true;
  }

  isRunning() {
    if (this.process) {
      return true;
    }

    if (!this.processPid) {
      return false;
    }

    const running = this.isPidRunning(this.processPid);
    if (!running) {
      this.processPid = null;
      this.elevated = false;
    }

    return running;
  }

  isPidRunning(pid) {
    if (!pid) {
      return false;
    }

    if (process.platform === 'win32') {
      const result = spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8' });
      if (result.status !== 0) {
        return false;
      }

      const stdout = (result.stdout || '').trim();

      return stdout.includes(`,\"${pid}\",`) || stdout.includes(`,${pid},`);
    }

    try {
      process.kill(pid, 0);

      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.processPid = null;
      this.elevated = false;
      logger.info('EASYTIER', '进程已停止');

      return true;
    }

    if (this.processPid && process.platform === 'win32') {
      const pid = this.processPid;
      const directKill = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
      if (directKill.status === 0) {
        this.processPid = null;
        this.elevated = false;
        logger.info('EASYTIER', `已停止提权进程，PID: ${pid}`);

        return true;
      }

      const toPsSingleQuoted = (value) => `'${String(value).replace(/'/g, "''")}'`;
      const script = `$p = Start-Process -FilePath 'taskkill.exe' -ArgumentList ${toPsSingleQuoted(`/PID ${pid} /T /F`)} -Verb RunAs -PassThru -Wait; exit $p.ExitCode`;
      const elevatedKill = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { encoding: 'utf8' }
      );

      if (elevatedKill.status === 0) {
        this.processPid = null;
        this.elevated = false;
        logger.info('EASYTIER', `已通过提权停止进程，PID: ${pid}`);

        return true;
      }

      const message = (elevatedKill.stderr || elevatedKill.stdout || directKill.stderr || '').trim();
      void logger.error('EASYTIER', `停止提权进程失败: ${message}`);

      return false;
    }

    return false;
  }

  getStatus() {
    return {
      running: this.isRunning(),
      pid: this.process ? this.process.pid : this.processPid
    };
  }

  async getPeers() {
    if (!this.isRunning()) {
      throw new Error('EasyTier 未运行');
    }

    const cliPath = this.getCliPath();
    if (!fs.existsSync(cliPath)) {
      throw new Error('未找到 EasyTier CLI');
    }

    return new Promise((resolve, reject) => {
      // Options must come before the command
      const args = ['-o', 'json'];
      if (this.rpcPort) {
        // CLI expects a socket address (e.g., 127.0.0.1:11010)
        args.push('-p', `127.0.0.1:${this.rpcPort}`);
      }
      args.push('peer', 'list');

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
          reject(new Error(`CLI 退出，退出码 ${code}: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject(new Error(`解析 CLI 输出失败: ${e.message}`));
          }
        }
      });
    });
  }

  async getRoute() {
    if (!this.isRunning()) {
      throw new Error('EasyTier 未运行');
    }

    const cliPath = this.getCliPath();
    if (!fs.existsSync(cliPath)) {
      throw new Error('未找到 EasyTier CLI');
    }

    return new Promise((resolve, reject) => {
      const args = ['-o', 'json'];
      if (this.rpcPort) {
        args.push('-p', `127.0.0.1:${this.rpcPort}`);
      }
      args.push('route', 'list');

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
          reject(new Error(`CLI 退出，退出码 ${code}: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject(new Error(`解析 CLI 输出失败: ${e.message}`));
          }
        }
      });
    });
  }

  async getNodeInfo() {
    if (!this.isRunning()) {
      throw new Error('EasyTier 未运行');
    }

    const cliPath = this.getCliPath();
    if (!fs.existsSync(cliPath)) {
      throw new Error('未找到 EasyTier CLI');
    }

    return new Promise((resolve, reject) => {
      const args = ['-o', 'json'];
      if (this.rpcPort) {
        args.push('-p', `127.0.0.1:${this.rpcPort}`);
      }
      args.push('node', 'info');

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
          reject(new Error(`CLI 退出，退出码 ${code}: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject(new Error(`解析 CLI 输出失败: ${e.message}`));
          }
        }
      });
    });
  }
}

export default EasyTierManager;
