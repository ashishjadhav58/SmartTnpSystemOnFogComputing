# PowerShell script to install all AI service dependencies
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing AI Services Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clear problematic environment variables
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
$env:http_proxy = ""
$env:https_proxy = ""
$env:PIP_NO_INDEX = ""

$ErrorActionPreference = "Stop"

try {
    Write-Host "Installing Resume AI Service dependencies..." -ForegroundColor Yellow
    Set-Location "resume-ai-service"
    python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
    Set-Location ..
    
    Write-Host ""
    Write-Host "Installing Placement Prediction Service dependencies..." -ForegroundColor Yellow
    Set-Location "placement-prediction-service"
    python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
    Set-Location ..
    
    Write-Host ""
    Write-Host "Installing Skill Match Service dependencies..." -ForegroundColor Yellow
    Set-Location "skill-match-service"
    python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
    Set-Location ..
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "All dependencies installed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the services using:" -ForegroundColor Cyan
    Write-Host "  .\start-all-services.bat" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to install dependencies: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Python and pip are installed and in your PATH." -ForegroundColor Yellow
    exit 1
}
