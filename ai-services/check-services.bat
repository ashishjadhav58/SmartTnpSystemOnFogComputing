@echo off
echo Checking AI Services Status...
echo ================================================

python check-services.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo To start services, run: start-all-services.bat
    pause
)
