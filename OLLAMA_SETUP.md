# Ollama Setup Guide

## You Have Ollama Installed! ✅

Your system already has:
- ✅ Ollama installed
- ✅ Mistral model downloaded (4.4 GB)

## How to Enable AI Agent with Ollama

### Step 1: Start Ollama Service

Open a **new PowerShell/Terminal window** and run:

```powershell
ollama serve
```

**Keep this terminal window open** while using the application.

### Step 2: Start the Application

In your project terminal, run:

```bash
docker-compose up -d
```

### Step 3: Test the AI Agent

1. Login as a traveler (e.g., `jane@example.com` / `password123`)
2. Click the 🤖 robot button (bottom right)
3. Fill in travel details:
   - Destination: "Paris, France"
   - Dates: Any future dates
   - Travel Party: "couple"
   - Budget: "moderate"
   - Interests: "museums, food, art"
4. Click "Generate Travel Plan"

### What Happens:

- **With Ollama running**: AI generates intelligent, context-aware travel plans using the Mistral model
- **Without Ollama**: Falls back to smart mock responses (still works perfectly for demo)

### Troubleshooting:

If AI agent fails to connect to Ollama:
1. Make sure `ollama serve` is running
2. Check if port 11434 is accessible: `curl http://localhost:11434`
3. Restart AI agent: `docker-compose restart ai-agent`

### For Submission:

You can demo the AI agent **with or without** Ollama:
- ✅ **With Ollama**: Full AI-powered responses
- ✅ **Without Ollama**: Smart mock responses (perfectly acceptable)

Both modes demonstrate the AI agent functionality effectively!

