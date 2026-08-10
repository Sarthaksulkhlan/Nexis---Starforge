# Matrix Core LiveKit Agent

This is the real-time voice worker for Aura. It follows the reference `rime-voice-agent` scaffold:

- LiveKit `AgentSession`
- LiveKit Inference STT
- RPC-controlled `start_turn`, `end_turn`, and `cancel_turn`
- Silero VAD
- LiveKit noise cancellation
- Rime Coda TTS

Matrix Core changes:

- Gemini LLM via `GOOGLE_API_KEY`
- Qdrant workflow/user-scoped memory retrieval inside each user turn
- Food ordering, healthcare, and cooking workflow prompts

## Install

From this `agent` directory:

```powershell
pip install uv
uv sync
```

## Run

Use the same root `.env.local` values as the Node server, or copy `agent/.env.example` to `agent/.env`.

```powershell
uv run agent.py dev
```

The Matrix Core frontend requests a LiveKit token from `/api/livekit/token`, joins the room, publishes microphone audio, and calls the agent RPC methods for push-to-talk turns.
