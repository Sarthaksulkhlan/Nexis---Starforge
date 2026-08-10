# MatrixCore

Aura Adaptive Voice Agent for the Matrix Core hackathon demo.

View your app in AI Studio: https://ai.studio/apps/f2d187b6-edd7-4e75-9a39-42f65428df0a

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create local environment config:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Set server-side credentials in `.env.local`:

   ```env
   GOOGLE_API_KEY="your_google_api_key"
   LIVEKIT_URL="wss://your-livekit-host"
   LIVEKIT_API_KEY="your_livekit_api_key"
   LIVEKIT_API_SECRET="your_livekit_api_secret"
   RIME_API_KEY="your_rime_api_key"
   QDRANT_URL="https://your-qdrant-host"
   QDRANT_API_KEY="your_qdrant_api_key"
   ```

   Do not commit `.env.local`.

3. Run the app:

   ```powershell
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

## Backend

The root Express server provides:

- `/api/livekit/token` for short-lived LiveKit browser tokens.
- `/api/chat` for workflow-aware Gemini responses using Qdrant memory retrieval.
- `/api/tts` for Rime Coda speech output.
- `/api/health` for safe service status.

The frontend is served by the same dev server on port `3000`.

## LiveKit Agent

Run the real-time Python voice agent in a second terminal:

```powershell
cd agent
pip install uv
uv sync
uv run agent.py dev
```

Then keep the Matrix Core frontend/server running from the repo root:

```powershell
npm run dev
```

Voice flow:

```text
Browser microphone -> LiveKit room -> Python agent -> LiveKit STT -> Gemini -> Qdrant memory -> Rime Coda -> LiveKit audio
```
