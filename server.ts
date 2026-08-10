import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Safe GenAI Initialization
  function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables");
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Voice Agent Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, taskTitle, experience = 'food', history, retrievedMemories } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        // Fallback simulated responses when API key is not yet set
        let simulatedText = "I remember you prefer spicy vegetarian food. Shall I add a large paneer pizza to your order?";
        if (experience === 'healthcare') {
          simulatedText = "I can assist with appointment scheduling and administrative guidance. What time slot would you prefer?";
        } else if (experience === 'cooking') {
          simulatedText = "Great! Step 1: Heat 2 tablespoons of butter and sauté the onions until soft. Tell me when you're ready for step 2.";
        }

        return res.json({
          response: simulatedText,
          retrievedContext: retrievedMemories || [],
          actionsTakenCount: 1
        });
      }

      const contextPrompt = `
You are AURA, an advanced adaptive AI Voice Agent.
Current Active Task: ${taskTitle || "Voice Task"} (${experience.toUpperCase()} mode)

Retrieved Context & Long-Term Memories:
${(retrievedMemories || [])
  .map((m: any) => `- [${m.id || "MEM"}] ${m.text || m.title} (${m.source || "Database"})`)
  .join("\n")}

User input: "${message}"

Mode Instructions:
- If Healthcare mode: Provide helpful administrative & appointment assistance. DO NOT diagnose medical conditions or provide unsafe medical advice. Clearly state you provide administrative guidance and can escalate to a human professional if needed.
- If Food Ordering mode: Help order food naturally using remembered dietary preferences and previous orders.
- If Home Cooking mode: Provide step-by-step cooking instructions, substitutions, and allow natural voice interruptions.

Keep responses conversational, concise (1-3 sentences maximum suitable for voice playback), direct, and helpful.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contextPrompt,
        config: {
          systemInstruction: "You are AURA, an adaptive voice agent. Speak in 1-3 natural, helpful sentences for speech output.",
          temperature: 0.7,
        }
      });

      const responseText = response.text || "I have processed your request and updated the context memory.";

      res.json({
        response: responseText,
        retrievedContext: retrievedMemories || [],
        actionsTakenCount: Math.floor(Math.random() * 2) + 1
      });
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({
        error: "Failed to generate AI response",
        details: error.message || String(error)
      });
    }
  });

  // TTS Speech Generation Endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "Zephyr" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.json({ audio: null, message: "Gemini key not configured for TTS endpoint" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      res.json({ audio: base64Audio || null });
    } catch (error: any) {
      console.error("Error generating TTS:", error);
      res.json({ audio: null, error: error.message });
    }
  });

  // Vite dev middleware vs Production static
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AURA Matrix Core] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
