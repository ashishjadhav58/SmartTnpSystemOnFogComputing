# LLM Integration Setup Guide

This guide explains how to configure the LLM (Large Language Model) integration for dynamic resume generation.

## Supported LLM Providers

1. **Groq (LLaMA 3)** - ⭐ RECOMMENDED - Ultra-fast, free, LLaMA 3 models
2. **OpenAI (GPT-3.5/4)** - High quality, paid
3. **Anthropic (Claude)** - High quality alternative, paid
4. **Ollama (Local LLaMA)** - Free, runs locally (slower)
5. **Fallback** - Rule-based (works without API keys)

## Configuration

### Option 1: Groq (⭐ RECOMMENDED - Fast & Free)

**Why Groq?**
- ⚡ Ultra-fast responses (faster than OpenAI)
- 🆓 Free tier with generous limits
- 🧠 LLaMA 3.1 models (llama-3.1-8b-instant, llama-3.1-70b-versatile)
- 🚀 No credit card required
- ✅ Perfect for production

1. Get your API key from [Groq Console](https://console.groq.com/keys)
2. Set environment variables:

```bash
export LLM_PROVIDER=groq
export GROQ_API_KEY=your-api-key-here
export GROQ_MODEL=llama-3.1-8b-instant  # or llama-3.1-70b-versatile for better quality
```

**Available Groq Models:**
- `llama-3.1-8b-instant` - Fast, free, recommended for most use cases (replaces deprecated llama3-8b-8192)
- `llama-3.1-70b-versatile` - More accurate, still fast (replaces deprecated llama3-70b-8192)
- `mixtral-8x7b-32768` - Long context (32K tokens)
- `gemma-7b-it` - Lightweight option

### Option 2: OpenAI

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set environment variables:

```bash
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-your-api-key-here
```

### Option 3: Anthropic (Claude)

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Set environment variables:

```bash
export LLM_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### Option 4: Ollama (Local LLaMA - Free)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model:
   ```bash
   ollama pull llama2
   # or
   ollama pull llama3
   # or
   ollama pull mistral
   ```
3. Start Ollama service (usually runs automatically)
4. Set environment variables:

```bash
export LLM_PROVIDER=ollama
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=llama2  # or llama3, mistral, etc.
```

### Option 5: Fallback (No API Required)

If no API keys are set, the system will use intelligent rule-based generation:

```bash
export LLM_PROVIDER=fallback
# No API keys needed
```

## Environment Variables

Create a `.env` file in `ai-services/resume-ai-service/`:

```env
# LLM Provider (groq recommended, openai, anthropic, ollama, fallback)
LLM_PROVIDER=groq

# Groq Configuration (RECOMMENDED - Fast & Free)
GROQ_API_KEY=your-api-key-here
GROQ_MODEL=llama-3.1-8b-instant

# OpenAI Configuration
OPENAI_API_KEY=

# Anthropic Configuration
ANTHROPIC_API_KEY=

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## Features Enabled by LLM

When LLM is configured, the resume builder provides:

1. **✨ AI Generate Project Description** - Auto-generates professional project descriptions
2. **✨ AI Generate Internship Description** - Creates compelling internship descriptions
3. **✨ Generate CV Summary** - Creates professional CV summary/objective
4. **🤖 AI Enhance** - Improves any resume section with professional language
5. **📄 Professional PDF Generation** - Generates formatted resume PDFs

## Testing

1. Start the AI service:
   ```bash
   cd ai-services/resume-ai-service
   python main.py
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:8001/health
   ```

   Response should show:
   ```json
   {
     "status": "healthy",
     "service": "resume-ai-service",
     "llm_provider": "openai"  // or your configured provider
   }
   ```

## Cost Considerations

- **Groq**: 🆓 **FREE** (generous free tier, no credit card needed)
- **OpenAI GPT-3.5**: ~$0.002 per resume generation
- **Anthropic Claude**: ~$0.003 per resume generation
- **Ollama**: Free (runs on your machine, slower)
- **Fallback**: Free (no API calls)

## Troubleshooting

### Groq API Errors
- Verify API key is correct (get from https://console.groq.com/keys)
- Check API key is set in environment: `echo $GROQ_API_KEY`
- Ensure Groq SDK is installed: `pip install groq`
- Check rate limits (free tier has limits but generous)

### OpenAI API Errors
- Verify API key is correct
- Check account has credits
- Ensure API key has proper permissions

### Anthropic API Errors
- Verify API key format (starts with `sk-ant-`)
- Check account status

### Ollama Connection Errors
- Ensure Ollama is running: `ollama serve`
- Verify model is downloaded: `ollama list`
- Check OLLAMA_BASE_URL is correct

### Fallback Mode
- Works automatically if no API keys are set
- Provides good quality without API costs
- Perfect for testing and development

## Best Practices

1. **⭐ Use Groq for Production**: Fast, free, and reliable - perfect for resume generation
2. **Start with Fallback**: Test the system with fallback mode first
3. **Use Ollama for Offline Development**: Free and works offline (slower)
4. **Monitor API Usage**: Groq has generous free limits, but monitor usage
5. **Keep API Keys Secure**: Never commit API keys to Git - use environment variables

## 🚨 Security Warning

**NEVER commit API keys to Git!**

✅ **Safe:**
- Environment variables
- `.env` file (in `.gitignore`)
- Secret management systems

❌ **Dangerous:**
- Hardcoded in code
- Committed to Git
- Shared in chat/messages
- Screenshots with keys visible

If you've exposed an API key:
1. **Immediately revoke it** at the provider's console
2. **Generate a new key**
3. **Update your environment variables**
