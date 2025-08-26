#!/bin/bash

# Install Git hooks script
echo "[INFO] Installing Git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy hook files
echo "[INFO] Copying pre-commit hooks..."

# Only copy the main pre-commit if it doesn't exist (first time setup)
if [ ! -f ".git/hooks/pre-commit" ]; then
    cp scripts/hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "[INFO] Installed default pre-commit hook (full lint mode)"
else
    echo "[INFO] Existing pre-commit hook preserved"
fi

cp scripts/hooks/pre-commit-staged-only .git/hooks/pre-commit-staged-only
cp scripts/hooks/pre-commit.ps1 .git/hooks/pre-commit.ps1
cp scripts/hooks/pre-commit-staged-only.ps1 .git/hooks/pre-commit-staged-only.ps1

# Make hooks executable (important for Unix-like systems)
chmod +x .git/hooks/pre-commit-staged-only
# Ensure the active pre-commit hook is executable
if [ -f ".git/hooks/pre-commit" ]; then
    chmod +x .git/hooks/pre-commit
fi

echo "[SUCCESS] Git hooks installed successfully!"
echo ""
echo "Available hooks:"
echo "  - pre-commit (default: full lint check)"
echo "  - pre-commit-staged-only (faster: only staged files)"
echo "  - *.ps1 versions for PowerShell users"
echo ""

# Check what's currently active
if [ -f ".git/hooks/pre-commit" ]; then
    if grep -q "# MODE: STAGED_ONLY" .git/hooks/pre-commit; then
        echo "[CURRENT] Using: staged-only mode (fast)"
    elif grep -q "# MODE: FULL_LINT" .git/hooks/pre-commit; then
        echo "[CURRENT] Using: full lint check mode"
    else
        echo "[CURRENT] Using: custom pre-commit hook (unknown mode)"
    fi
else
    echo "[WARNING] No active pre-commit hook found!"
fi

echo ""
echo "Quick setup options:"
echo "  [1] Keep current setup"
echo "  [2] Switch to staged-only mode (recommended for daily use)"
echo "  [3] Switch to full lint mode"
echo ""

read -p "Choose an option (1-3) or press Enter to keep current: " choice

case $choice in
    2)
        cp .git/hooks/pre-commit .git/hooks/pre-commit-full 2>/dev/null || true
        cp .git/hooks/pre-commit-staged-only .git/hooks/pre-commit
        echo "[SUCCESS] Switched to staged-only mode!"
        ;;
    3)
        if [ -f ".git/hooks/pre-commit-full" ]; then
            cp .git/hooks/pre-commit-full .git/hooks/pre-commit
            echo "[SUCCESS] Switched to full lint mode!"
        else
            # Use the default full lint version
            cp scripts/hooks/pre-commit .git/hooks/pre-commit
            chmod +x .git/hooks/pre-commit
            echo "[SUCCESS] Switched to full lint mode!"
        fi
        ;;
    *)
        echo "[INFO] Keeping current configuration"
        ;;
esac

echo ""
echo "Manual switch commands:"
echo "  Staged-only: cp .git/hooks/pre-commit-staged-only .git/hooks/pre-commit"
echo "  Full check:  cp scripts/hooks/pre-commit .git/hooks/pre-commit"
echo ""
echo "To skip hooks temporarily: git commit --no-verify"
