const { spawn } = require('child_process');
const os = require('os');

console.log('[INFO] Detecting platform and installing Git hooks...');

const platform = os.platform();
const isWindows = platform === 'win32';

let command, args;
if (!isWindows) {
    // Try PowerShell first
    command = 'powershell';
    args = ['-ExecutionPolicy', 'Bypass', '-File', './scripts/install-hooks.ps1'];
} else {
    // Unix-like systems (Linux, macOS)
    command = 'bash';
    args = ['./scripts/install-hooks.sh'];
}

const child = spawn(command, args, {
    stdio: 'inherit', // This allows interactive input/output
    shell: true
});

child.on('error', (error) => {
    console.error(`[ERROR] Failed to install hooks: ${error.message}`);
    if (isWindows && error.code === 'ENOENT') {
        console.log('\n[INFO] PowerShell not available, trying alternative method...');
        console.log('[MANUAL] Please run one of these commands manually:');
        console.log('  npm run install-hooks-ps1   # PowerShell');
        console.log('  npm run install-hooks-bash  # Git Bash');
    }
    process.exit(1);
});

child.on('close', (code) => {
    if (code !== 0) {
        console.log(`[INFO] Hook installation exited with code ${code}`);
    }
});
