# N2N Binary Files Directory

This directory contains platform-specific N2N edge binaries:

- `windows/edge.exe` - Windows binary
- `linux/edge` - Linux binary  
- `macos/edge` - macOS binary

## How to add binaries:

1. Download or compile N2N edge binaries for each platform
2. Place them in the appropriate subdirectory
3. Ensure Unix binaries have executable permissions

## Security:

- Binary files should be verified with SHA256 checksums before deployment
- Files are loaded from classpath at runtime and copied to temp directory
- Passwords are never logged in plain text

## References:

- N2N Project: https://github.com/ntop/n2n
- Build Instructions: See project documentation
