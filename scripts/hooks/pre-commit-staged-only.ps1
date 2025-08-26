# MODE: STAGED_ONLY
# PowerShell pre-commit hook to run lint check on staged files only
Write-Host "Running ESLint check on staged files..." -ForegroundColor Yellow

# Change to front directory
Set-Location front

# Get list of staged files in front directory
$stagedFilesOutput = git diff --cached --name-only --diff-filter=ACM
$stagedFiles = $stagedFilesOutput | Where-Object { 
    $_ -match '\.(vue|js|ts|jsx|tsx)$' -and $_ -match '^front/' 
} | ForEach-Object { 
    $_ -replace '^front/', '' 
}

if (-not $stagedFiles -or $stagedFiles.Count -eq 0) {
    Write-Host "No front-end files to lint. Skipping ESLint check." -ForegroundColor Green
    exit 0
}

Write-Host "Checking files: $($stagedFiles -join ', ')" -ForegroundColor Cyan

# Run lint check on staged files only
$lintArgs = @("run", "lint", "--") + $stagedFiles
$result = Start-Process -FilePath "npm" -ArgumentList $lintArgs -Wait -NoNewWindow -PassThru

# Check the exit code
if ($result.ExitCode -eq 0) {
    Write-Host "✅ ESLint check passed. Proceeding with commit..." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ ESLint check failed. Please fix the linting errors before committing." -ForegroundColor Red
    Write-Host "You can run 'npm run lint:fix' to automatically fix some issues." -ForegroundColor Yellow
    exit 1
}
