@echo off
echo Starting AI Microservices...

start "Resume AI Service" cmd /k "cd resume-ai-service && python main.py"
timeout /t 2 /nobreak >nul

start "Placement Prediction Service" cmd /k "cd placement-prediction-service && python main.py"
timeout /t 2 /nobreak >nul

start "Skill Match Service" cmd /k "cd skill-match-service && python main.py"
timeout /t 2 /nobreak >nul

echo All services started in separate windows!
pause
