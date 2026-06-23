# PowerShell script to start all AI services using main.py
Write-Host "Starting All AI Services with Unified Launcher..." -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Start main.py
python main.py

# If script exits, pause to see output
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
