@echo off
echo ========================================
echo Starting AI Service with Debug Output
echo ========================================
echo.

echo Select service to start:
echo 1. Resume AI Service (Port 8001)
echo 2. Placement Prediction Service (Port 8002)
echo 3. Skill Match Service (Port 8003)
echo 4. All Services
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo Starting Resume AI Service...
    cd resume-ai-service
    python main.py
    goto end
)

if "%choice%"=="2" (
    echo Starting Placement Prediction Service...
    cd placement-prediction-service
    python main.py
    goto end
)

if "%choice%"=="3" (
    echo Starting Skill Match Service...
    cd skill-match-service
    python main.py
    goto end
)

if "%choice%"=="4" (
    echo Starting all services...
    call start-all-services.bat
    goto end
)

echo Invalid choice!
pause
:end
