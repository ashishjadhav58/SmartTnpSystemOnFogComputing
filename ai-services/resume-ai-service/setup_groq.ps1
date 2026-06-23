# Groq Setup Script for Windows PowerShell
# Run this script to set up Groq for the Resume Builder

Write-Host "🚀 Setting up Groq for Resume Builder..." -ForegroundColor Cyan
Write-Host ""

# Check if Groq SDK is installed
Write-Host "📦 Checking Groq SDK installation..." -ForegroundColor Yellow
try {
    $groqCheck = python -c "import groq; print('installed')" 2>&1
    if ($groqCheck -match "installed") {
        Write-Host "✅ Groq SDK is already installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Groq SDK not found. Installing..." -ForegroundColor Red
        pip install groq
        Write-Host "✅ Groq SDK installed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Error checking Groq SDK. Installing..." -ForegroundColor Yellow
    pip install groq
}

Write-Host ""
Write-Host "🔑 API Key Setup" -ForegroundColor Cyan
Write-Host "Please enter your Groq API key (get it from https://console.groq.com/keys):" -ForegroundColor Yellow
$apiKey = Read-Host "Groq API Key"

if ($apiKey) {
    # Set environment variable permanently
    [System.Environment]::SetEnvironmentVariable("GROQ_API_KEY", $apiKey, [System.EnvironmentVariableTarget]::User)
    Write-Host "✅ API key set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️ IMPORTANT: Please restart your terminal for changes to take effect" -ForegroundColor Yellow
} else {
    Write-Host "❌ No API key provided. Please set it manually:" -ForegroundColor Red
    Write-Host "   setx GROQ_API_KEY `"your-key-here`"" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
$envContent = @"
# Groq Configuration (Fast & Free LLaMA 3)
LLM_PROVIDER=groq
GROQ_API_KEY=$apiKey
GROQ_MODEL=llama-3.1-8b-instant
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ .env file created" -ForegroundColor Green

Write-Host ""
Write-Host "🧪 Testing Groq connection..." -ForegroundColor Cyan
python groq_test.py

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal" -ForegroundColor White
Write-Host "2. Start the AI service: python main.py" -ForegroundColor White
Write-Host "3. Use the Resume Builder with AI features!" -ForegroundColor White
