# Groq Integration - Quick Start Guide

## ⚠️ IMPORTANT: Security First!

**You've exposed your API key in the chat. Please:**

1. **Revoke the exposed key immediately**: https://console.groq.com/keys
2. **Generate a new key**
3. **Never share API keys in chat, GitHub, or screenshots**

## ✅ Safe Setup (5 minutes)

### Step 1: Install Groq SDK

```bash
cd ai-services/resume-ai-service
pip install groq
```

### Step 2: Set API Key (Environment Variable)

**Windows (PowerShell):**
```powershell
setx GROQ_API_KEY "your_new_api_key_here"
```
**⚠️ Restart terminal after this command**

**Linux / Mac:**
```bash
export GROQ_API_KEY="your_new_api_key_here"
```

### Step 3: Configure Provider

Create `.env` file in `ai-services/resume-ai-service/`:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_new_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### Step 4: Test Connection

```bash
python groq_test.py
```

Expected output:
```
✅ Groq API key found
Testing Groq API connection...

✅ Groq API connection successful!

Generated text:
--------------------------------------------------
Developed a full-stack web application using React for the frontend...
--------------------------------------------------

🎉 Groq is working perfectly! Your resume builder is ready to use.
```

### Step 5: Start AI Service

```bash
python main.py
```

The service will now use Groq for all LLM operations!

## 🚀 Why Groq is Perfect for Resume Builder

- ⚡ **Ultra-fast**: Responses in 1-2 seconds (vs 5-10s for OpenAI)
- 🆓 **Free**: Generous free tier, no credit card needed
- 🧠 **LLaMA 3.1**: Latest open-source models
- ✅ **Production-ready**: Reliable and scalable
- 💰 **Cost-effective**: Free tier covers most use cases

## 📊 Available Models

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `llama-3.1-8b-instant` | ⚡⚡⚡ | ⭐⭐⭐ | **Recommended** - Fast & accurate (replaces deprecated llama3-8b-8192) |
| `llama3-70b-8192` | ⚡⚡ | ⭐⭐⭐⭐ | Better quality, slightly slower |
| `mixtral-8x7b-32768` | ⚡⚡ | ⭐⭐⭐⭐ | Long context (32K tokens) |
| `gemma-7b-it` | ⚡⚡⚡ | ⭐⭐ | Lightweight option |

## 🎯 Next Steps

1. ✅ Revoke exposed API key
2. ✅ Generate new key
3. ✅ Set environment variable
4. ✅ Test with `groq_test.py`
5. ✅ Start AI service
6. ✅ Use Resume Builder with AI features!

## 🔒 Security Best Practices

✅ **DO:**
- Use environment variables
- Store in `.env` file (add to `.gitignore`)
- Use secrets management in production
- Rotate keys regularly

❌ **DON'T:**
- Commit API keys to Git
- Share keys in chat/messages
- Hardcode in source code
- Include in screenshots

## 🐛 Troubleshooting

### "Groq SDK not installed"
```bash
pip install groq
```

### "GROQ_API_KEY not found"
- Verify environment variable is set: `echo $GROQ_API_KEY` (Linux/Mac) or `echo %GROQ_API_KEY%` (Windows)
- Restart terminal after setting with `setx`
- Check `.env` file exists and has correct format

### "API key invalid"
- Verify key is correct at https://console.groq.com/keys
- Ensure no extra spaces or quotes
- Generate new key if needed

### Rate Limit Errors
- Groq free tier has limits but is generous
- Wait a few seconds and retry
- Consider upgrading if needed

## 📝 Example Usage

Once configured, the Resume Builder will automatically use Groq for:
- ✨ AI Generate Project Description
- ✨ AI Generate Internship Description  
- ✨ Generate CV Summary
- 🤖 AI Enhance sections

No code changes needed - just set the environment variable!
