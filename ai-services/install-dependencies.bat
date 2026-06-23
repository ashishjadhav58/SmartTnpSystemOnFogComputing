@echo off
echo ========================================
echo Installing AI Services Dependencies
echo ========================================
echo.

echo Installing Resume AI Service dependencies...
cd resume-ai-service
python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Resume AI Service dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Installing Placement Prediction Service dependencies...
cd placement-prediction-service
python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Placement Prediction Service dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Installing Skill Match Service dependencies...
cd skill-match-service
python -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Skill Match Service dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo All dependencies installed successfully!
echo ========================================
echo.
echo You can now start the services using:
echo   .\start-all-services.bat
echo.
pause
