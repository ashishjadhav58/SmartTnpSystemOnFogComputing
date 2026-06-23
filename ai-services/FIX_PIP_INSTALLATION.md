# Fixing Pip Installation Issues

## Problem
Pip cannot install packages due to:
1. `no-index='1'` configuration blocking PyPI
2. Proxy configuration issues

## Solution

### Option 1: Fix Pip Configuration (Recommended)

1. **Find pip config file location**:
   ```powershell
   python -m pip config list -v
   ```

2. **Edit pip config** (usually in `%APPDATA%\pip\pip.ini` or `%APPDATA%\pip\pip.conf`):
   - Remove or comment out `no-index = true`
   - Fix or remove proxy settings if needed

3. **Or create/update pip.ini**:
   ```ini
   [global]
   index-url = https://pypi.org/simple
   trusted-host = pypi.org
   ```

### Option 2: Install with Environment Variables

Run this in PowerShell:
```powershell
# Clear proxy and no-index settings
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
$env:http_proxy = ""
$env:https_proxy = ""
$env:PIP_NO_INDEX = ""

# Install packages
python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org fastapi uvicorn[standard] pydantic numpy scikit-learn joblib python-multipart
```

### Option 3: Manual Installation Script

Create a file `install-fix.ps1`:
```powershell
# Clear problematic environment variables
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
$env:http_proxy = ""
$env:https_proxy = ""
$env:PIP_NO_INDEX = ""

# Install all required packages
$packages = @(
    "fastapi",
    "uvicorn[standard]",
    "pydantic",
    "numpy",
    "scikit-learn",
    "joblib",
    "python-multipart"
)

foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Yellow
    python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org $package
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install $package" -ForegroundColor Red
    }
}

Write-Host "Installation complete!" -ForegroundColor Green
```

### Option 4: Use pip.ini Configuration File

1. Create/edit `%APPDATA%\pip\pip.ini`:
   ```ini
   [global]
   index-url = https://pypi.org/simple
   trusted-host = pypi.org
              pypi.python.org
              files.pythonhosted.org
   ```

2. Then run normal pip install:
   ```powershell
   python -m pip install fastapi uvicorn[standard] pydantic numpy scikit-learn joblib python-multipart
   ```

## Verify Installation

After fixing, verify packages are installed:
```powershell
python -c "import fastapi; print('FastAPI installed:', fastapi.__version__)"
python -c "import uvicorn; print('Uvicorn installed')"
python -c "import pydantic; print('Pydantic installed')"
python -c "import numpy; print('NumPy installed')"
python -c "import sklearn; print('Scikit-learn installed')"
```

## Quick Fix Command

Run this single command to fix and install:
```powershell
$env:HTTP_PROXY = ""; $env:HTTPS_PROXY = ""; $env:http_proxy = ""; $env:https_proxy = ""; $env:PIP_NO_INDEX = ""; python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org fastapi "uvicorn[standard]" pydantic numpy scikit-learn joblib python-multipart
```
