# Install Git hooks script (PowerShell version)
Write-Host "[INFO] Installing Git hooks..." -ForegroundColor Yellow

# Create hooks directory if it doesn't exist
if (!(Test-Path ".git\hooks")) {
    New-Item -ItemType Directory -Path ".git\hooks" -Force | Out-Null
    Write-Host "[INFO] Created .git\hooks directory" -ForegroundColor Cyan
}

# Copy hook files
Write-Host "[INFO] Copying pre-commit hooks..." -ForegroundColor Cyan

# Only copy the main pre-commit if it doesn't exist (first time setup)
if (!(Test-Path ".git\hooks\pre-commit")) {
    Copy-Item "scripts\hooks\pre-commit" ".git\hooks\pre-commit" -Force
    Write-Host "[INFO] Installed default pre-commit hook (full lint mode)" -ForegroundColor Cyan
} else {
    Write-Host "[INFO] Existing pre-commit hook preserved" -ForegroundColor Cyan
}

Copy-Item "scripts\hooks\pre-commit-staged-only" ".git\hooks\pre-commit-staged-only" -Force
Copy-Item "scripts\hooks\pre-commit.ps1" ".git\hooks\pre-commit.ps1" -Force
Copy-Item "scripts\hooks\pre-commit-staged-only.ps1" ".git\hooks\pre-commit-staged-only.ps1" -Force

Write-Host "[SUCCESS] Git hooks installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Available hooks:" -ForegroundColor White
Write-Host "  - pre-commit (default: full lint check)"
Write-Host "  - pre-commit-staged-only (faster: only staged files)"
Write-Host "  - *.ps1 versions for PowerShell users"
Write-Host ""

# Check what's currently active
if (Test-Path ".git\hooks\pre-commit") {
    $hookContent = Get-Content ".git\hooks\pre-commit" -Raw
    if ($hookContent -match "# MODE: STAGED_ONLY") {
        Write-Host "[CURRENT] Using: staged-only mode (fast)" -ForegroundColor Green
    } elseif ($hookContent -match "# MODE: FULL_LINT") {
        Write-Host "[CURRENT] Using: full lint check mode" -ForegroundColor Green
    } else {
        Write-Host "[CURRENT] Using: custom pre-commit hook (unknown mode)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] No active pre-commit hook found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Quick setup options:" -ForegroundColor Yellow
Write-Host "  [1] Keep current setup"
Write-Host "  [2] Switch to staged-only mode (recommended for daily use)"
Write-Host "  [3] Switch to full lint mode"
Write-Host ""

$choice = Read-Host "Choose an option (1-3) or press Enter to keep current"

switch ($choice) {
    "2" {
        Copy-Item ".git\hooks\pre-commit" ".git\hooks\pre-commit-full" -Force -ErrorAction SilentlyContinue
        Copy-Item ".git\hooks\pre-commit-staged-only" ".git\hooks\pre-commit" -Force
        Write-Host "[SUCCESS] Switched to staged-only mode!" -ForegroundColor Green
    }
    "3" {
        if (Test-Path ".git\hooks\pre-commit-full") {
            Copy-Item ".git\hooks\pre-commit-full" ".git\hooks\pre-commit" -Force
            Write-Host "[SUCCESS] Switched to full lint mode!" -ForegroundColor Green
        } else {
            # Use the default full lint version
            Copy-Item "scripts\hooks\pre-commit" ".git\hooks\pre-commit" -Force
            Write-Host "[SUCCESS] Switched to full lint mode!" -ForegroundColor Green
        }
    }
    default {
        Write-Host "[INFO] Keeping current configuration" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Manual switch commands:" -ForegroundColor Yellow
Write-Host "  Staged-only: Copy-Item .git\hooks\pre-commit-staged-only .git\hooks\pre-commit -Force"
Write-Host "  Full check:  Copy-Item scripts\hooks\pre-commit .git\hooks\pre-commit -Force"
Write-Host ""
Write-Host ""
Write-Host "To skip hooks temporarily: git commit --no-verify" -ForegroundColor Cyan
