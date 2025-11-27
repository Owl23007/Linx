param([string]$ZipPath)

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

Write-Host "Step 1: 清理旧的 electron..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\electron" -ErrorAction SilentlyContinue
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 2: 创建 electron 骨架目录..." -ForegroundColor Yellow
$ElectronVersion = Read-Host "请输入 Electron 版本 (例如 38.0.0)"
if ([string]::IsNullOrEmpty($ElectronVersion)) {
    $ElectronVersion = "38.0.0"
    Write-Host "未输入版本，使用默认版本: $ElectronVersion" -ForegroundColor DarkGray
}
pnpm add electron@$ElectronVersion --save-dev --ignore-scripts
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 3: 解压 electron 包..." -ForegroundColor Yellow
$distPath = "node_modules\electron\dist"
Remove-Item -Recurse -Force $distPath -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $distPath -Force | Out-Null
Expand-Archive -Path $ZipPath -DestinationPath $distPath -Force
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 4: 设置 path.txt..." -ForegroundColor Yellow
$pathTxtFile = "node_modules\electron\path.txt"
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($pathTxtFile, "electron.exe", $Utf8NoBom)
Write-Host "完成" -ForegroundColor Green

Write-Host "Step 5: 重新构建原生模块..." -ForegroundColor Yellow
pnpm electron-rebuild
Write-Host "完成" -ForegroundColor Green

Write-Host "成功! 现在运行: pnpm start" -ForegroundColor Green
