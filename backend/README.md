# Matrix Core Backend

This repo currently runs the backend and frontend from the root Node/Express server:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open the frontend at:

```text
http://localhost:3000
```

## Server Endpoints

- `GET /api/health` returns safe service configuration status without secrets.
- `POST /api/livekit/token` returns a short-lived LiveKit token, room name, identity, workflow, and LiveKit URL.
- `POST /api/chat` retrieves workflow-scoped Qdrant memories, calls Gemini for short voice-agent text, and stores useful memory updates.
- `POST /api/tts` converts Aura's response to Rime speech and returns base64 audio for browser playback.

## Environment

Use `.env.local` at the repo root for local development. Do not commit real secrets.

Required for the full hackathon demo:

- `GOOGLE_API_KEY`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `RIME_API_KEY`
- `QDRANT_URL`
- `QDRANT_API_KEY`

The app can still run without these values, but unavailable services will return safe fallback responses.
