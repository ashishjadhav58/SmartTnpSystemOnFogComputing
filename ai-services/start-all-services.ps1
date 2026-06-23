# PowerShell script to start all AI services
Write-Host "Starting AI Microservices..." -ForegroundColor Green

# Start Resume AI Service
Write-Host "Starting Resume AI Service on port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\resume-ai-service'; python main.py"
Start-Sleep -Seconds 2

# Start Placement Prediction Service
Write-Host "Starting Placement Prediction Service on port 8002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\placement-prediction-service'; python main.py"
Start-Sleep -Seconds 2

# Start Skill Match Service
Write-Host "Starting Skill Match Service on port 8003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\skill-match-service'; python main.py"
Start-Sleep -Seconds 2

Write-Host "`nAll services started in separate windows!" -ForegroundColor Green
Write-Host "Check each window to verify services are running." -ForegroundColor Cyan
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
