#!/bin/bash
# Groq Setup Script for Linux/Mac
# Run this script to set up Groq for the Resume Builder

echo "🚀 Setting up Groq for Resume Builder..."
echo ""

# Check if Groq SDK is installed
echo "📦 Checking Groq SDK installation..."
if python3 -c "import groq" 2>/dev/null; then
    echo "✅ Groq SDK is already installed"
else
    echo "❌ Groq SDK not found. Installing..."
    pip install groq
    echo "✅ Groq SDK installed successfully"
fi

echo ""
echo "🔑 API Key Setup"
echo "Please enter your Groq API key (get it from https://console.groq.com/keys):"
read -s apiKey

if [ -n "$apiKey" ]; then
    # Add to .bashrc/.zshrc
    if [ -f ~/.bashrc ]; then
        if ! grep -q "GROQ_API_KEY" ~/.bashrc; then
            echo "" >> ~/.bashrc
            echo "# Groq API Key for Resume Builder" >> ~/.bashrc
            echo "export GROQ_API_KEY=\"$apiKey\"" >> ~/.bashrc
            echo "✅ API key added to ~/.bashrc"
        fi
    fi
    
    if [ -f ~/.zshrc ]; then
        if ! grep -q "GROQ_API_KEY" ~/.zshrc; then
            echo "" >> ~/.zshrc
            echo "# Groq API Key for Resume Builder" >> ~/.zshrc
            echo "export GROQ_API_KEY=\"$apiKey\"" >> ~/.zshrc
            echo "✅ API key added to ~/.zshrc"
        fi
    fi
    
    # Set for current session
    export GROQ_API_KEY="$apiKey"
    echo "✅ API key set for current session"
    echo ""
    echo "⚠️ IMPORTANT: Run 'source ~/.bashrc' or restart terminal for permanent setup" -ForegroundColor Yellow
else
    echo "❌ No API key provided. Please set it manually:"
    echo "   export GROQ_API_KEY=\"your-key-here\""
fi

echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
# Groq Configuration (Fast & Free LLaMA 3)
LLM_PROVIDER=groq
GROQ_API_KEY=$apiKey
GROQ_MODEL=llama-3.1-8b-instant
EOF
echo "✅ .env file created"

echo ""
echo "🧪 Testing Groq connection..."
python3 groq_test.py

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Source your shell config: source ~/.bashrc (or ~/.zshrc)"
echo "2. Start the AI service: python3 main.py"
echo "3. Use the Resume Builder with AI features!"
