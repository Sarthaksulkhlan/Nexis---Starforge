import crypto from "crypto";
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || "matrix_core_memory";
const EMBEDDING_SIZE = 128;
const LIVEKIT_AGENT_NAME = process.env.LIVEKIT_AGENT_NAME || "matrix-core-agent";
const GEMINI_MODELS = Array.from(
  new Set([
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash",
  ]),
);

type Workflow = "food" | "healthcare" | "cooking";

type MemoryPayload = {
  text: string;
  user_id: string;
  workflow: Workflow;
  memory_type: string;
  timestamp: string;
  source?: string;
};

const WORKFLOW_PROMPTS: Record<Workflow, string> = {
  food:
    "Food ordering mode. Help build or modify a food order. Use remembered dietary preferences and unfinished order state. Confirm choices briefly.",
  healthcare:
    "Healthcare mode. Provide administrative help and general health information only. Do not diagnose, prescribe, or give unsafe medical instructions. Escalate serious symptoms to professional care.",
  cooking:
    "Home cooking mode. Give hands-free recipe help, substitutions, and one clear step at a time. Keep responses easy to interrupt.",
};

const DEMO_MEMORIES: Record<Workflow, Array<Omit<MemoryPayload, "user_id" | "timestamp">>> = {
  food: [
    { workflow: "food", memory_type: "preference", text: "user prefers spicy vegetarian food", source: "demo_seed" },
    { workflow: "food", memory_type: "previous_order", text: "previously ordered large paneer pizza", source: "demo_seed" },
    { workflow: "food", memory_type: "menu_context", text: "relevant menu has paneer pizza, veg biryani, chole bowl, and masala fries", source: "demo_seed" },
  ],
  healthcare: [
    { workflow: "healthcare", memory_type: "task", text: "user previously asked for appointment scheduling help", source: "demo_seed" },
    { workflow: "healthcare", memory_type: "safety_policy", text: "for serious symptoms, recommend urgent professional medical care", source: "demo_seed" },
  ],
  cooking: [
    { workflow: "cooking", memory_type: "preference", text: "user prefers vegetarian recipes", source: "demo_seed" },
    { workflow: "cooking", memory_type: "recipe_state", text: "paneer butter masala recipe: continue with gravy preparation", source: "demo_seed" },
  ],
};

function normalizeWorkflow(value: unknown): Workflow {
  if (value === "healthcare") return "healthcare";
  if (value === "cooking" || value === "home_cooking") return "cooking";
  return "food";
}

function getUserId(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || "demo-user";
}

function getGenAI() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Google API key is not configured; Gemini calls will use demo fallbacks.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { "User-Agent": "matrix-core-hackathon" },
    },
  });
}

function hashEmbedding(text: string) {
  const vector = new Array<number>(EMBEDDING_SIZE).fill(0);
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];

  for (const word of words) {
    const digest = crypto.createHash("sha256").update(word).digest();
    for (let i = 0; i < digest.length; i += 2) {
      const index = digest[i] % EMBEDDING_SIZE;
      const sign = digest[i + 1] % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

async function qdrantRequest(pathname: string, init: RequestInit = {}) {
  const baseUrl = process.env.QDRANT_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (process.env.QDRANT_API_KEY) {
    headers["api-key"] = process.env.QDRANT_API_KEY;
  }

  const response = await fetch(`${baseUrl}${pathname}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Qdrant ${response.status}: ${body.slice(0, 160)}`);
  }
  return response.status === 204 ? null : response.json();
}

async function ensureQdrantCollection() {
  if (!process.env.QDRANT_URL) return false;

  try {
    await qdrantRequest(`/collections/${QDRANT_COLLECTION}`);
    return true;
  } catch (error: any) {
    if (!String(error.message || error).includes("404")) {
      return true;
    }
    await qdrantRequest(`/collections/${QDRANT_COLLECTION}`, {
      method: "PUT",
      body: JSON.stringify({
        vectors: {
          size: EMBEDDING_SIZE,
          distance: "Cosine",
        },
      }),
    });
    return true;
  }
}

async function ensureQdrantPayloadIndexes() {
  if (!process.env.QDRANT_URL) return;
  await ensureQdrantCollection();

  for (const fieldName of ["user_id", "workflow"]) {
    try {
      await qdrantRequest(`/collections/${QDRANT_COLLECTION}/index`, {
        method: "PUT",
        body: JSON.stringify({
          field_name: fieldName,
          field_schema: "keyword",
        }),
      });
    } catch (error: any) {
      const message = String(error.message || error);
      if (!message.includes("already exists")) {
        console.warn(`Qdrant payload index for ${fieldName} could not be ensured:`, message);
      }
    }
  }
}

function pointId(userId: string, workflow: Workflow, text: string) {
  const hex = crypto.createHash("sha256").update(`${userId}:${workflow}:${text}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function upsertMemory(payload: MemoryPayload) {
  if (!process.env.QDRANT_URL) return false;
  await ensureQdrantCollection();
  await qdrantRequest(`/collections/${QDRANT_COLLECTION}/points?wait=true`, {
    method: "PUT",
    body: JSON.stringify({
      points: [
        {
          id: pointId(payload.user_id, payload.workflow, payload.text),
          vector: hashEmbedding(payload.text),
          payload,
        },
      ],
    }),
  });
  return true;
}

async function seedWorkflowMemories(userId: string, workflow: Workflow) {
  if (!process.env.QDRANT_URL) return;
  await ensureQdrantPayloadIndexes();
  await Promise.all(
    DEMO_MEMORIES[workflow].map((memory) =>
      upsertMemory({
        ...memory,
        user_id: userId,
        timestamp: new Date().toISOString(),
      }),
    ),
  );
}

async function retrieveMemories(userId: string, workflow: Workflow, query: string) {
  if (!process.env.QDRANT_URL) return [] as MemoryPayload[];

  try {
    await seedWorkflowMemories(userId, workflow);
    const result = await qdrantRequest(`/collections/${QDRANT_COLLECTION}/points/search`, {
      method: "POST",
      body: JSON.stringify({
        vector: hashEmbedding(query),
        limit: 4,
        with_payload: true,
        filter: {
          must: [
            { key: "user_id", match: { value: userId } },
            { key: "workflow", match: { value: workflow } },
          ],
        },
      }),
    });

    return (result?.result || [])
      .map((item: any) => item.payload)
      .filter((payload: any): payload is MemoryPayload => Boolean(payload?.text));
  } catch (error: any) {
    console.warn("Qdrant memory retrieval failed:", error.message || String(error));
    return [];
  }
}

async function saveUsefulMemory(userId: string, workflow: Workflow, message: string, responseText: string) {
  const text = `${message} ${responseText}`.toLowerCase();
  const memories: Array<Omit<MemoryPayload, "user_id" | "workflow" | "timestamp">> = [];

  if (workflow === "food") {
    if (text.includes("spicy")) memories.push({ memory_type: "preference", text: "user likes spicy food", source: "conversation" });
    if (text.includes("vegetarian") || text.includes("veg")) memories.push({ memory_type: "preference", text: "user prefers vegetarian options", source: "conversation" });
    if (text.includes("paneer")) memories.push({ memory_type: "order_state", text: "unfinished order includes paneer item", source: "conversation" });
    if (text.includes("large")) memories.push({ memory_type: "order_state", text: "unfinished order size is large", source: "conversation" });
  }

  if (workflow === "cooking" && (text.includes("paneer") || text.includes("recipe"))) {
    memories.push({ memory_type: "recipe_state", text: "active cooking session is paneer-focused", source: "conversation" });
  }

  await Promise.all(
    memories.map((memory) =>
      upsertMemory({
        ...memory,
        user_id: userId,
        workflow,
        timestamp: new Date().toISOString(),
      }).catch((error) => console.warn("Qdrant memory save failed:", error.message || String(error))),
    ),
  );
}

function fallbackResponse(workflow: Workflow, memories: MemoryPayload[]) {
  const context = memories.map((memory) => memory.text).join(" ").toLowerCase();
  if (workflow === "healthcare") {
    return "I can help with appointment tasks and general information. If this feels urgent, please contact a medical professional now.";
  }
  if (workflow === "cooking") {
    return context.includes("paneer")
      ? "I remember you're working with paneer. Want the next cooking step?"
      : "I can guide you one step at a time. What are you cooking?";
  }
  return context.includes("spicy vegetarian")
    ? "You usually prefer spicy vegetarian food. Want me to suggest paneer pizza or a veg biryani?"
    : "I can help build your food order. What are you hungry for?";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwt(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest();
  return `${encodedHeader}.${encodedPayload}.${base64Url(signature)}`;
}

function createLiveKitToken(identity: string, roomName: string, metadata: Record<string, string>) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      iss: apiKey,
      sub: identity,
      name: identity,
      metadata: JSON.stringify(metadata),
      nbf: now - 10,
      exp: now + 60 * 30,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    },
    apiSecret,
  );
}

function createLiveKitAdminToken(roomName: string) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      iss: apiKey,
      sub: "matrix-core-server",
      nbf: now - 10,
      exp: now + 60 * 5,
      video: {
        room: roomName,
        roomAdmin: true,
      },
    },
    apiSecret,
  );
}

function liveKitHttpUrl() {
  const rawUrl = process.env.LIVEKIT_URL?.replace(/\/$/, "");
  if (!rawUrl) return "";
  return rawUrl.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");
}

async function dispatchLiveKitAgent(roomName: string, metadata: Record<string, string>) {
  const token = createLiveKitAdminToken(roomName);
  const baseUrl = liveKitHttpUrl();
  if (!token || !baseUrl) return null;

  const response = await fetch(`${baseUrl}/twirp/livekit.AgentDispatchService/CreateDispatch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_name: LIVEKIT_AGENT_NAME,
      room: roomName,
      metadata: JSON.stringify(metadata),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LiveKit agent dispatch failed ${response.status}: ${body.slice(0, 180)}`);
  }

  return response.json();
}

async function synthesizeWithRime(text: string) {
  const apiKey = process.env.RIME_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(process.env.RIME_API_URL || "https://users.rime.ai/v1/rime-tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      speaker: process.env.RIME_SPEAKER || "astra",
      modelId: process.env.RIME_MODEL_ID || "coda",
      language: process.env.RIME_LANGUAGE || "en",
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Rime ${response.status}: ${body.slice(0, 160)}`);
  }

  const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { audio, mimeType: "audio/mpeg" };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", async (_req, res) => {
    res.json({
      status: "ok",
      services: {
        gemini: Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
        rime: Boolean(process.env.RIME_API_KEY),
        qdrant: Boolean(process.env.QDRANT_URL),
        livekit: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/livekit/token", async (req, res) => {
    const workflow = normalizeWorkflow(req.body?.workflow || req.body?.experience);
    const userId = getUserId(req.body?.userId);
    const roomName = String(req.body?.roomName || `nexis-${workflow}-${Date.now()}`);
    const identity = String(req.body?.participantName || `${userId}-${crypto.randomUUID().slice(0, 8)}`);
    const metadata = { user_id: userId, workflow };
    const token = createLiveKitToken(identity, roomName, metadata);

    if (!process.env.LIVEKIT_URL || !token) {
      return res.status(503).json({ error: "LiveKit credentials are not configured on the server." });
    }

    try {
      await dispatchLiveKitAgent(roomName, metadata);
    } catch (error: any) {
      console.warn("LiveKit agent dispatch failed:", error.message || String(error));
      return res.status(503).json({
        error: "AURA agent could not be dispatched. Make sure the Python agent is running.",
      });
    }

    res.json({
      url: process.env.LIVEKIT_URL,
      token,
      roomName,
      identity,
      workflow,
      agentName: LIVEKIT_AGENT_NAME,
    });
  });

  app.post("/api/chat", async (req, res) => {
    const startedAt = Date.now();
    try {
      const { message, taskTitle, history } = req.body;
      const workflow = normalizeWorkflow(req.body?.workflow || req.body?.experience);
      const userId = getUserId(req.body?.userId);

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const qdrantStartedAt = Date.now();
      const memories = await retrieveMemories(userId, workflow, message);
      const qdrantMs = Date.now() - qdrantStartedAt;
      const ai = getGenAI();

      let responseText = fallbackResponse(workflow, memories);
      let llmMs = 0;

      if (ai) {
        try {
          const llmStartedAt = Date.now();
          let responseTextFromModel = "";
          for (const model of GEMINI_MODELS) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: `
Current task: ${taskTitle || "Matrix Core voice session"}
Workflow: ${workflow}
Workflow instructions: ${WORKFLOW_PROMPTS[workflow]}

Retrieved Qdrant memory:
${memories.length ? memories.map((m) => `- ${m.text} [${m.memory_type}]`).join("\n") : "- none"}

Recent conversation:
${Array.isArray(history) ? history.slice(-6).map((m: any) => `${m.sender}: ${m.text}`).join("\n") : "- none"}

User said: "${message}"
`,
                config: {
                  systemInstruction:
                    "You are AURA, Matrix Core's adaptive voice agent. Use retrieved context when relevant. Give one or two short spoken sentences. Never mention internal APIs. In healthcare mode, stay safe and non-diagnostic.",
                },
              });
              responseTextFromModel = response.text || "";
              break;
            } catch (error: any) {
              console.warn(`Gemini generation failed for ${model}:`, error.message || String(error));
            }
          }
          llmMs = Date.now() - llmStartedAt;
          responseText = (responseTextFromModel || responseText).trim();
        } catch (error: any) {
          console.warn("Gemini generation failed:", error.message || String(error));
        }
      }

      await saveUsefulMemory(userId, workflow, message, responseText);

      const latency = {
        qdrantMs,
        llmMs,
        totalMs: Date.now() - startedAt,
      };
      console.log("AURA turn latency", latency);

      res.json({
        response: responseText,
        workflow,
        retrievedContext: memories.map((memory) => ({
          id: pointId(memory.user_id, memory.workflow, memory.text),
          text: memory.text,
          source: "Qdrant Retrieval",
          memory_type: memory.memory_type,
        })),
        actionsTakenCount: 1,
        latency,
      });
    } catch (error: any) {
      console.error("Safe /api/chat failure:", error.message || String(error));
      res.status(500).json({
        response: "I hit a temporary issue, but I can keep helping. Please say that again.",
        error: "AURA_CHAT_FAILED",
      });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      if (!text) return res.status(400).json({ error: "Text is required" });

      const ttsStartedAt = Date.now();
      const audio = await synthesizeWithRime(text);
      console.log("AURA TTS latency", { ttsMs: Date.now() - ttsStartedAt });

      if (!audio) {
        return res.status(503).json({ audio: null, error: "Rime is not configured on the server." });
      }

      res.json({
        ...audio,
        provider: "rime",
        modelId: process.env.RIME_MODEL_ID || "coda",
        speaker: process.env.RIME_SPEAKER || "astra",
      });
    } catch (error: any) {
      console.warn("Rime synthesis failed:", error.message || String(error));
      res.status(502).json({ audio: null, error: "Rime synthesis failed." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Matrix Core] Server listening on http://localhost:${PORT}`);
  });
}

startServer();
