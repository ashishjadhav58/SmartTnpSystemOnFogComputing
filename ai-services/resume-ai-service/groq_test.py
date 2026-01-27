"""
Quick test script to verify Groq integration
Run this to test your Groq API key setup
"""

import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()  # Load .env file if it exists
    print("[OK] Loading environment variables from .env file...")
except ImportError:
    print("[INFO] python-dotenv not installed. Using system environment variables only.")
    print("   Install with: pip install python-dotenv")

from groq import Groq

# Get API key from environment (now includes .env file)
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("[ERROR] GROQ_API_KEY not found in environment variables")
    print("Set it with: export GROQ_API_KEY='your-key-here'")
    print("Or create a .env file in this directory with: GROQ_API_KEY=your-key-here")
    exit(1)

print("[OK] Groq API key found")
print("Testing Groq API connection...\n")

try:
    client = Groq(api_key=api_key)
    
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful resume writing assistant."},
            {"role": "user", "content": "Write a one-sentence professional project description for a web application built with React and Node.js"}
        ],
        max_tokens=150,
        temperature=0.7
    )
    
    print("[OK] Groq API connection successful!\n")
    print("Generated text:")
    print("-" * 50)
    print(response.choices[0].message.content)
    print("-" * 50)
    print("\n[SUCCESS] Groq is working perfectly! Your resume builder is ready to use.")
    
except ImportError:
    print("[ERROR] Groq SDK not installed")
    print("Install with: pip install groq")
except Exception as e:
    print(f"[ERROR] Connection error: {type(e).__name__}")
    print(f"Details: {str(e)}")
    print("\nTroubleshooting:")
    print("1. Verify your API key is correct")
    print("2. Check your internet connection")
    print("3. Ensure you have Groq API access")
    print("4. Check if the API key has been revoked or expired")
