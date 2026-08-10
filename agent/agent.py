"""Matrix Core Aura LiveKit voice agent.

This keeps the reference repo's LiveKit transport pattern:
browser RPC start_turn/end_turn -> AgentSession input gating -> Rime speech.

Matrix Core-specific behavior lives here:
- Gemini is the LLM.
- Rime Coda is the only spoken output.
- Qdrant retrieval is injected into the active turn before Gemini responds.
- Workflow and user id come from room/job/participant metadata.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import math
import os
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID

import httpx
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    ChatContext,
    ChatMessage,
    JobContext,
    RoomInputOptions,
    WorkerOptions,
    cli,
    inference,
)
from livekit.plugins import google, noise_cancellation, rime, silero

load_dotenv("../.env.local")
load_dotenv("../.env")
load_dotenv()

logger = logging.getLogger("matrix-core-agent")

Workflow = Literal["food", "healthcare", "cooking"]

QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "matrix_core_memory")
EMBEDDING_SIZE = 128
AGENT_NAME = "matrix-core-agent"

WORKFLOW_PROMPTS: dict[Workflow, str] = {
    "food": (
        "FOOD ORDERING mode. Build or modify a food order. Use remembered "
        "dietary preferences, prior orders, menu context, and unfinished order state. "
        "Confirm choices briefly. This is the primary demo workflow."
    ),
    "healthcare": (
        "HEALTHCARE mode. Provide administrative help and general health information only. "
        "Do not diagnose, prescribe, or provide unsafe medical instructions. For serious "
        "symptoms, recommend professional or urgent care."
    ),
    "cooking": (
        "HOME COOKING mode. Give hands-free cooking help, recipe steps, substitutions, "
        "and one short next step at a time."
    ),
}

DEMO_MEMORIES: dict[Workflow, list[dict[str, str]]] = {
    "food": [
        {"memory_type": "preference", "text": "user prefers spicy vegetarian food", "source": "demo_seed"},
        {"memory_type": "previous_order", "text": "previously ordered large paneer pizza", "source": "demo_seed"},
        {"memory_type": "menu_context", "text": "menu includes paneer pizza, veg biryani, chole bowl, and masala fries", "source": "demo_seed"},
    ],
    "healthcare": [
        {"memory_type": "task", "text": "user previously asked for appointment scheduling help", "source": "demo_seed"},
        {"memory_type": "safety_policy", "text": "serious symptoms should be escalated to professional medical care", "source": "demo_seed"},
    ],
    "cooking": [
        {"memory_type": "preference", "text": "user prefers vegetarian recipes", "source": "demo_seed"},
        {"memory_type": "recipe_state", "text": "paneer butter masala recipe can continue with gravy preparation", "source": "demo_seed"},
    ],
}


def _normalize_workflow(value: Any) -> Workflow:
    if value == "healthcare":
        return "healthcare"
    if value in {"cooking", "home_cooking"}:
        return "cooking"
    return "food"


def _hash_embedding(text: str) -> list[float]:
    vector = [0.0] * EMBEDDING_SIZE
    words = [part for part in "".join(ch.lower() if ch.isalnum() else " " for ch in text).split() if part]
    for word in words:
        digest = hashlib.sha256(word.encode("utf-8")).digest()
        for index in range(0, len(digest), 2):
            bucket = digest[index] % EMBEDDING_SIZE
            sign = 1 if digest[index + 1] % 2 == 0 else -1
            vector[bucket] += sign

    magnitude = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / magnitude for value in vector]


def _point_id(user_id: str, workflow: Workflow, text: str) -> str:
    raw = hashlib.sha256(f"{user_id}:{workflow}:{text}".encode("utf-8")).hexdigest()[:32]
    return str(UUID(f"{raw[:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:]}"))


def _metadata_from_json(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except ValueError:
        logger.warning("could not parse LiveKit metadata")
        return {}


async def _resolve_session_config(ctx: JobContext) -> tuple[str, Workflow]:
    metadata = _metadata_from_json(ctx.room.metadata) or _metadata_from_json(ctx.job.metadata)

    if not metadata:
        try:
            participant = await asyncio.wait_for(ctx.wait_for_participant(), timeout=8)
            metadata = _metadata_from_json(getattr(participant, "metadata", "") or "")
        except asyncio.TimeoutError:
            logger.warning("no participant metadata found; using demo defaults")

    user_id = str(metadata.get("user_id") or metadata.get("userId") or "demo-user")
    workflow = _normalize_workflow(metadata.get("workflow") or metadata.get("industry") or metadata.get("experience"))
    return user_id, workflow


class MatrixMemoryStore:
    def __init__(self) -> None:
        self.url = (os.getenv("QDRANT_URL") or "").rstrip("/")
        self.api_key = os.getenv("QDRANT_API_KEY")
        self.headers = {"Content-Type": "application/json"}
        if self.api_key:
            self.headers["api-key"] = self.api_key

    @property
    def enabled(self) -> bool:
        return bool(self.url)

    async def _request(self, method: str, path: str, json_body: dict[str, Any] | None = None) -> dict[str, Any] | None:
        if not self.enabled:
            return None
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.request(method, f"{self.url}{path}", headers=self.headers, json=json_body)
        if response.status_code >= 400:
            raise RuntimeError(f"Qdrant {response.status_code}: {response.text[:180]}")
        if not response.content:
            return None
        return response.json()

    async def ensure_collection(self) -> None:
        if not self.enabled:
            return
        try:
            await self._request("GET", f"/collections/{QDRANT_COLLECTION}")
        except RuntimeError as error:
            if "404" not in str(error):
                return
            await self._request(
                "PUT",
                f"/collections/{QDRANT_COLLECTION}",
                {"vectors": {"size": EMBEDDING_SIZE, "distance": "Cosine"}},
            )

        for field_name in ("user_id", "workflow"):
            try:
                await self._request(
                    "PUT",
                    f"/collections/{QDRANT_COLLECTION}/index",
                    {"field_name": field_name, "field_schema": "keyword"},
                )
            except RuntimeError as error:
                if "already exists" not in str(error):
                    logger.warning("Qdrant payload index failed for %s: %s", field_name, error)

    async def upsert_memory(self, user_id: str, workflow: Workflow, text: str, memory_type: str, source: str) -> None:
        if not self.enabled:
            return
        await self.ensure_collection()
        payload = {
            "text": text,
            "user_id": user_id,
            "workflow": workflow,
            "memory_type": memory_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source,
        }
        await self._request(
            "PUT",
            f"/collections/{QDRANT_COLLECTION}/points?wait=true",
            {
                "points": [
                    {
                        "id": _point_id(user_id, workflow, text),
                        "vector": _hash_embedding(text),
                        "payload": payload,
                    }
                ]
            },
        )

    async def seed(self, user_id: str, workflow: Workflow) -> None:
        await asyncio.gather(
            *[
                self.upsert_memory(user_id, workflow, memory["text"], memory["memory_type"], memory["source"])
                for memory in DEMO_MEMORIES[workflow]
            ],
            return_exceptions=True,
        )

    async def retrieve(self, user_id: str, workflow: Workflow, query: str) -> list[dict[str, Any]]:
        if not self.enabled:
            return []
        try:
            await self.seed(user_id, workflow)
            result = await self._request(
                "POST",
                f"/collections/{QDRANT_COLLECTION}/points/search",
                {
                    "vector": _hash_embedding(query),
                    "limit": 4,
                    "with_payload": True,
                    "filter": {
                        "must": [
                            {"key": "user_id", "match": {"value": user_id}},
                            {"key": "workflow", "match": {"value": workflow}},
                        ]
                    },
                },
            )
            return [item.get("payload", {}) for item in (result or {}).get("result", []) if item.get("payload")]
        except Exception as error:
            logger.warning("Qdrant retrieval failed; continuing without memory: %s", error)
            return []


class MatrixCoreAgent(Agent):
    def __init__(self, *, user_id: str, workflow: Workflow, memory: MatrixMemoryStore) -> None:
        self.user_id = user_id
        self.workflow = workflow
        self.memory = memory
        super().__init__(
            instructions=(
                "You are AURA, Matrix Core's adaptive voice agent. "
                "Speak in one or two short sentences for low-latency voice. "
                "Use retrieved memory when relevant. Do not mention internal APIs. "
                f"{WORKFLOW_PROMPTS[workflow]}"
            )
        )

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        user_text = getattr(new_message, "text_content", "") or ""
        started = asyncio.get_event_loop().time()
        memories = await self.memory.retrieve(self.user_id, self.workflow, user_text)
        elapsed_ms = int((asyncio.get_event_loop().time() - started) * 1000)
        logger.info("Qdrant retrieval workflow=%s memories=%s latency_ms=%s", self.workflow, len(memories), elapsed_ms)

        if memories:
            context = "\n".join(f"- {memory.get('text')} [{memory.get('memory_type')}]" for memory in memories)
            turn_ctx.add_message(
                role="assistant",
                content=f"Relevant Qdrant memory for this turn:\n{context}",
            )
            await self.update_chat_ctx(turn_ctx)


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    user_id, workflow = await _resolve_session_config(ctx)
    memory = MatrixMemoryStore()
    logger.info("Matrix Core session started user_id=%s workflow=%s", user_id, workflow)

    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3", language="en"),
        llm=google.LLM(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), temperature=0.55),
        tts=rime.TTS(
            model=os.getenv("RIME_MODEL_ID", "coda"),
            speaker=os.getenv("RIME_SPEAKER", "astra"),
        ),
        vad=silero.VAD.load(),
        turn_detection="manual",
        preemptive_generation=False,
    )

    @session.on("user_input_transcribed")
    def _on_user_transcript(ev):
        logger.info("STT heard: %r final=%s", getattr(ev, "transcript", None), getattr(ev, "is_final", None))

    await session.start(
        room=ctx.room,
        agent=MatrixCoreAgent(user_id=user_id, workflow=workflow, memory=memory),
        room_input_options=RoomInputOptions(noise_cancellation=noise_cancellation.BVC()),
    )

    session.input.set_audio_enabled(False)

    @ctx.room.local_participant.register_rpc_method("start_turn")
    async def _start_turn(data):
        session.interrupt()
        session.clear_user_turn()
        session.input.set_audio_enabled(True)
        return "ok"

    @ctx.room.local_participant.register_rpc_method("end_turn")
    async def _end_turn(data):
        session.input.set_audio_enabled(False)
        session.commit_user_turn()
        return "ok"

    @ctx.room.local_participant.register_rpc_method("cancel_turn")
    async def _cancel_turn(data):
        session.input.set_audio_enabled(False)
        session.clear_user_turn()
        return "ok"

    greeting = {
        "food": "Hi, I'm Aura. Tell me what you're hungry for.",
        "healthcare": "Hi, I'm Aura. I can help with appointments and general health information.",
        "cooking": "Hi, I'm Aura. What are we cooking today?",
    }[workflow]
    await session.say(greeting, allow_interruptions=True)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name=AGENT_NAME))
