import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置
const VERSION = 'v2.4.5'; // 可以在这里更新版本
const BASE_URL = `https://github.com/EasyTier/EasyTier/releases/download/${VERSION}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BIN_DIR = path.join(ROOT_DIR, 'electron', 'bin', 'easytier');

function getExpectedBinaries() {
  if (process.platform === 'win32') {
    return ['easytier-core.exe', 'easytier-cli.exe'];
  }

  return ['easytier-core', 'easytier-cli'];
}

function hasAllBinaries(binDir) {
  const expected = getExpectedBinaries();

  return expected.every((name) => fs.existsSync(path.join(binDir, name)));
}

// 确保 bin 目录存在
if (!fs.existsSync(BIN_DIR)) {
  fs.mkdirSync(BIN_DIR, { recursive: true });
}

// 检测平台和架构
const platform = process.platform;
const arch = process.arch;

const PLATFORM_MAP = {
  'win32': 'windows',
  'linux': 'linux',
  'darwin': 'macos'
};

const ARCH_MAP = {
  'x64': 'x86_64',
  'arm64': 'aarch64'
};

if (!PLATFORM_MAP[platform] || !ARCH_MAP[arch]) {
  console.error(`Unsupported platform: ${platform} ${arch}`);
  process.exit(1);
}

const targetPlatform = PLATFORM_MAP[platform];
const targetArch = ARCH_MAP[arch];
const extension = 'zip'; // EasyTier releases 主要是 zip
const fileName = `easytier-${targetPlatform}-${targetArch}-${VERSION}.${extension}`;
const downloadUrl = `${BASE_URL}/${fileName}`;
const tempFilePath = path.join(BIN_DIR, fileName);

// 解析代理参数
const args = process.argv.slice(2);
const forceDownload = args.includes('--force');

if (!forceDownload && hasAllBinaries(BIN_DIR)) {
  console.log('Detected existing EasyTier binaries. Skipping download. Use --force to re-download.');
  process.exit(0);
}

// 优先从环境变量获取代理
let proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || null;

// 命令行参数覆盖环境变量
const proxyIndex = args.indexOf('--proxy');
if (proxyIndex !== -1 && args[proxyIndex + 1]) {
  proxyUrl = args[proxyIndex + 1];
} else {
  // 支持 --proxy=url 格式
  const arg = args.find(a => a.startsWith('--proxy='));
  if (arg) {
    proxyUrl = arg.split('=')[1];
  }
}

let proxyConfig = false;

if (proxyUrl) {
  try {
    const url = new URL(proxyUrl);
    proxyConfig = {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
    };
    if (url.username) {
      proxyConfig.auth = {
        username: url.username,
        password: url.password
      };
    }
    console.log(`Using proxy: ${proxyUrl}`);
  } catch (e) {
    console.error('Invalid proxy URL:', e.message);
  }
}

console.log(`Detected platform: ${targetPlatform} (${arch})`);
console.log(`Downloading ${fileName} from ${downloadUrl}...`);

// 下载文件
const file = fs.createWriteStream(tempFilePath);

axios({
  method: 'get',
  url: downloadUrl,
  responseType: 'stream',
  proxy: proxyConfig
}).then(response => {
  response.data.pipe(file);
  handleDownload(response, file);
}).catch(err => {
  console.error(`Download error: ${err.message}`);
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  process.exit(1);
});

function handleDownload(response, file) {
  const len = parseInt(response.headers['content-length'], 10);
  const total = len / 1048576; // 1024 * 1024

  const timer = setInterval(() => {
    const cur = file.bytesWritten;
    if (!isNaN(len) && len > 0) {
      const percent = (100.0 * cur / len).toFixed(2);
      const downloaded = (cur / 1048576).toFixed(2);
      process.stdout.write(`\rDownloading: ${percent}% (${downloaded} MB / ${total.toFixed(2)} MB)`);
    } else {
      const downloaded = (cur / 1048576).toFixed(2);
      process.stdout.write(`\rDownloading: ${downloaded} MB`);
    }
  }, 100);

  file.on('finish', () => {
    clearInterval(timer);
    file.close(() => {
      console.log('\nDownload completed. Extracting...');
      extractFile(tempFilePath, BIN_DIR);
    });
  });
}

function extractFile(zipPath, targetDir) {
  try {
    // 尝试使用系统命令解压，避免引入额外依赖
    if (platform === 'win32') {
      // Windows 使用 PowerShell Expand-Archive
      // 注意：Expand-Archive 会创建一个子文件夹，我们需要处理一下
      const command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`;
      execSync(command);
    } else {
      // Linux/Mac 使用 unzip
      execSync(`unzip -o '${zipPath}' -d '${targetDir}'`);
    }

    console.log('Extraction completed.');

    // 清理 zip 文件
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    // 整理文件：EasyTier 解压后通常会在一个子文件夹里
    // 例如 easytier-windows-x86_64-v2.4.5/easytier-core.exe
    // 我们需要把它移动到 bin 根目录
    organizeBinaries(targetDir);

  } catch (error) {
    console.error(`Extraction failed: ${error.message}`);
    console.log('Please install "adm-zip" manually if system unzip fails, or download the binary manually.');
    process.exit(1);
  }
}

function organizeBinaries(targetDir) {
  const items = fs.readdirSync(targetDir);
  // 查找解压出来的文件夹（通常以 easytier 开头）
  const folderName = items.find(item => item.startsWith('easytier-') && fs.statSync(path.join(targetDir, item)).isDirectory());

  if (folderName) {
    const sourceDir = path.join(targetDir, folderName);
    const files = fs.readdirSync(sourceDir);

    files.forEach(file => {
      // 移动所有文件，不仅仅是 easytier-core
      const src = path.join(sourceDir, file);
      const dest = path.join(targetDir, file);
      // 如果目标存在，先删除
      if (fs.existsSync(dest)) {
        if (fs.statSync(dest).isDirectory()) {
          fs.rmSync(dest, { recursive: true, force: true });
        } else {
          fs.unlinkSync(dest);
        }
      }

      fs.renameSync(src, dest);

      // Linux/Mac 添加执行权限
      if (platform !== 'win32' && file.startsWith('easytier-core')) {
        fs.chmodSync(dest, '755');
      }
      console.log(`Moved ${file} to ${targetDir}`);
    });

    // 清理空文件夹
    try {
      // 递归删除文件夹
      fs.rmSync(sourceDir, { recursive: true, force: true });
    } catch (e) {
      console.warn(`Could not remove temp dir ${sourceDir}: ${e.message}`);
    }
  } else {
    // 可能是直接解压在当前目录（不太可能，但以防万一）
    console.log('No subfolder found, checking for binary in root...');
  }

  if (!hasAllBinaries(targetDir)) {
    console.error('EasyTier binaries are incomplete after extraction.');
    process.exit(1);
  }

  console.log('EasyTier binary setup complete.');
}
