# Fix and Install AI Service Dependencies
# This script fixes pip configuration issues and installs all required packages

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Pip Configuration and Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clear problematic environment variables
Write-Host "Clearing proxy and no-index settings..." -ForegroundColor Yellow
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

$failed = @()

foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Yellow
    python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org $package
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARNING] Failed to install $package" -ForegroundColor Red
        $failed += $package
    } else {
        Write-Host "  [OK] $package installed successfully" -ForegroundColor Green
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "All packages installed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Some packages failed to install:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running this script again, or install manually:" -ForegroundColor Yellow
    Write-Host "  python -m pip install --trusted-host pypi.org <package-name>" -ForegroundColor White
}

Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Cyan
python -c "import fastapi; print('[OK] FastAPI:', fastapi.__version__)" 2>$null
python -c "import uvicorn; print('[OK] Uvicorn installed')" 2>$null
python -c "import pydantic; print('[OK] Pydantic installed')" 2>$null
python -c "import numpy; print('[OK] NumPy installed')" 2>$null
python -c "import sklearn; print('[OK] Scikit-learn installed')" 2>$null

Write-Host ""
Write-Host "Done! You can now start the services." -ForegroundColor Green
