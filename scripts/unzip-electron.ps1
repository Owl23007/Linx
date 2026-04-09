param([string]$ZipPath)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$FrontDir = Join-Path $RepoRoot "front"

if (Test-Path (Join-Path $FrontDir "package.json")) {
    $ProjectDir = $FrontDir
} else {
    $ProjectDir = (Get-Location).Path
}

$ElectronRoot = Join-Path $ProjectDir "node_modules\electron"

function Invoke-PnpmInProject {
    param([string[]]$Args)

    & pnpm --dir "$ProjectDir" @Args
    if ($LASTEXITCODE -ne 0) {
        Write-Host "命令执行失败: pnpm --dir $ProjectDir $($Args -join ' ')" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

if ([string]::IsNullOrEmpty($ZipPath)) {
    Write-Host "请输入已下载的 electron zip 包的完整路径:" -ForegroundColor Cyan
    $ZipPath = Read-Host "ZipPath"
}

# 去除路径两端的引号
$ZipPath = $ZipPath.Trim('"').Trim("'")

if (-not (Test-Path $ZipPath)) {
    Write-Host "错误: 文件不存在: $ZipPath" -ForegroundColor Red
    exit 1
}

Write-Host "使用的 Electron 包: $ZipPath" -ForegroundColor Cyan
Write-Host "目标项目目录: $ProjectDir" -ForegroundColor Cyan

Write-Host "Step 1: 清理旧的 electron..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $ElectronRoot -ErrorAction SilentlyContinue
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 2: 创建 electron 骨架目录..." -ForegroundColor Yellow
$ElectronVersion = Read-Host "请输入 Electron 版本 (例如 41.2.0)"
if ([string]::IsNullOrEmpty($ElectronVersion)) {
    $ElectronVersion = "41.2.0"
    Write-Host "未输入版本，使用默认版本: $ElectronVersion" -ForegroundColor DarkGray
}
Invoke-PnpmInProject @("add", "electron@$ElectronVersion", "--save-dev", "--ignore-scripts")
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 3: 解压 electron 包..." -ForegroundColor Yellow
$distPath = Join-Path $ElectronRoot "dist"
Remove-Item -Recurse -Force $distPath -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $distPath -Force | Out-Null
Expand-Archive -Path $ZipPath -DestinationPath $distPath -Force
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 4: 设置 path.txt..." -ForegroundColor Yellow
$pathTxtFile = Join-Path $ElectronRoot "path.txt"
$pathTxtDir = Split-Path -Parent $pathTxtFile
if (-not (Test-Path $pathTxtDir)) {
    New-Item -ItemType Directory -Path $pathTxtDir -Force | Out-Null
}
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($pathTxtFile, "electron.exe", $Utf8NoBom)
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 5: 重新构建原生模块..." -ForegroundColor Yellow
Invoke-PnpmInProject @("exec", "electron-rebuild", "-v", "$ElectronVersion")
Write-Host "完成" -ForegroundColor Green

Write-Host "成功! 现在运行: pnpm --dir $ProjectDir start" -ForegroundColor Green
