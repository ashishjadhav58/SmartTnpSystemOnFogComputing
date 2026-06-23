# How to Start AI Services

## ⚠️ IMPORTANT: Install Dependencies First!

Before starting services, you **must** install Python dependencies.

**If you get "ModuleNotFoundError" or pip can't find packages**, use the fix script:

### Windows PowerShell (Recommended - Fixes pip issues)
```powershell
cd ai-services
.\install-fix.ps1
```

### Alternative: Standard Install
```powershell
cd ai-services
.\install-dependencies.ps1
```

### Windows CMD
```cmd
cd ai-services
install-dependencies.bat
```

### Linux/Mac
```bash
cd ai-services
chmod +x install-dependencies.sh
./install-dependencies.sh
```

Or install manually for each service:
```bash
cd ai-services/resume-ai-service
pip install -r requirements.txt

cd ../placement-prediction-service
pip install -r requirements.txt

cd ../skill-match-service
pip install -r requirements.txt
```

## Windows PowerShell (Recommended)

In PowerShell, you **must** use `.\` prefix:

```powershell
cd ai-services
.\start-all-services.bat
```

Or use the PowerShell script:
```powershell
cd ai-services
.\start-all-services.ps1
```

## Windows CMD

In Command Prompt, you can use without `.\`:

```cmd
cd ai-services
start-all-services.bat
```

## Why the difference?

- **PowerShell**: Requires `.\` for security (prevents running scripts from current directory by default)
- **CMD**: Doesn't require `.\` prefix

## Alternative: Start Individually

If batch script doesn't work, start each service manually:

### Terminal 1 - Resume AI Service (Port 8001)
```bash
cd ai-services/resume-ai-service
python main.py
```

### Terminal 2 - Placement Prediction Service (Port 8002)
```bash
cd ai-services/placement-prediction-service
python main.py
```

### Terminal 3 - Skill Match Service (Port 8003)
```bash
cd ai-services/skill-match-service
python main.py
```

## Verify Services are Running

After starting, check status:
```bash
cd ai-services
python check-services.py
```

Expected output:
```
[OK] Resume AI Service: Running - healthy
[OK] Placement Prediction Service: Running - healthy
[OK] Skill Match Service: Running - healthy
[SUCCESS] All AI services are running!
```

## Troubleshooting

### "Command not found" in PowerShell
**Solution**: Use `.\start-all-services.bat` instead of `start-all-services.bat`

### "Port already in use"
**Solution**: Another process is using the port. Find and close it, or change the port in `main.py`

### "Module not found" or "No module named 'fastapi'"
**Solution**: Install dependencies first:
```powershell
cd ai-services
.\install-dependencies.ps1    # PowerShell
# or
install-dependencies.bat      # CMD
```

Or install manually:
```bash
cd ai-services/resume-ai-service
pip install -r requirements.txt
cd ../placement-prediction-service
pip install -r requirements.txt
cd ../skill-match-service
pip install -r requirements.txt
```

### Services start but don't respond
**Solution**: 
1. Check if Python is in PATH
2. Verify ports 8001, 8002, 8003 are not blocked
3. Check firewall settings
