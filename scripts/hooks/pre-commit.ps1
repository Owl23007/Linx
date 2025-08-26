# MODE: FULL_LINT
# PowerShell pre-commit hook to run lint check
Write-Host "Running ESLint check..." -ForegroundColor Yellow

# Change to front directory
Set-Location front

# Run lint check
$result = Start-Process -FilePath "npm" -ArgumentList "run", "lint" -Wait -NoNewWindow -PassThru

# Check the exit code
if ($result.ExitCode -eq 0) {
    Write-Host "✅ ESLint check passed. Proceeding with commit..." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ ESLint check failed. Please fix the linting errors before committing." -ForegroundColor Red
    Write-Host "You can run 'npm run lint:fix' to automatically fix some issues." -ForegroundColor Yellow
    exit 1
}
