import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body-parser sizes for base64 audio payloads
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Lazy initializer for Google Gen AI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY environment variable is required. Please add it to your .env file or secrets panel."
      );
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// ==========================================
// API Endpoints
// ==========================================

// 1. Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 2. Audio Transcription API
// FIX: contents array must use {text: ...} parts, not bare strings
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res
        .status(400)
        .json({ error: "No audio data provided. Please record or upload audio." });
    }

    const ai = getAi();
    const resolvedMime = mimeType || "audio/webm";
    console.log(`Transcribing audio — mimeType: ${resolvedMime}`);

    // FIX: contents must be an array of Part objects, not mixed string literals
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",  // FIX: gemini-3.5-flash does not exist
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: audio,
                mimeType: resolvedMime,
              },
            },
            {
              text: "You are an elite academic transcriptionist. Transcribe every word spoken clearly and in order. Do not synthesize, summarize, omit, or interpret. Format the output with clear paragraph breaks when speakers transition or change topics. If the audio is completely silent or has no speech, respond with: '[No speech detected]'",
            },
          ],
        },
      ],
    });

    res.json({ text: response.text || "[No transcription text returned]" });
  } catch (error: any) {
    console.error("Transcription endpoint error:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred during audio transcription." });
  }
});

// 2b. YouTube Content Synthesis API
// FIX: Gemini cannot fetch/watch YouTube videos directly. It has no access to
// YouTube's audio or video streams. The previous implementation silently
// hallucinated transcripts. This endpoint now:
//  - Extracts the video ID
//  - Uses Google Search grounding to find publicly available info about the video
//  - Honestly synthesizes educational content BASED ON search results
//  - Returns a clearly labeled "synthesized content" result so the UI can
//    display an appropriate disclaimer to the user
app.post("/api/transcribe-youtube", async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) {
      return res
        .status(400)
        .json({ error: "No YouTube URL provided." });
    }

    // Extract video ID
    let videoId = "";
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }

    if (!videoId) {
      return res.status(400).json({
        error:
          "Could not extract a valid YouTube video ID from the URL. Please check the link and try again.",
      });
    }

    const ai = getAi();

    // Use search grounding to find real information about this video
    const prompt = `A student wants to study from this YouTube video: ${youtubeUrl}

Your task:
1. Search for information about this specific YouTube video — its title, channel, topic, key concepts covered, and any available transcript or captions published on the web.
2. Based only on what you find, produce a detailed educational content summary that reads like lecture notes. Cover every major concept, example, formula, or explanation discussed in the video.
3. Be specific and technical — include terminology, equations, code snippets, or processes mentioned.
4. Start your response immediately with the content — no preamble like "Here is the transcript". 
5. If you cannot find specific information about this video, say so clearly at the start.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",  // FIX: correct model name
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";

    // Detect if Gemini admitted it couldn't find the video
    const couldNotFind =
      text.toLowerCase().includes("cannot find") ||
      text.toLowerCase().includes("could not find") ||
      text.toLowerCase().includes("no specific information") ||
      text.toLowerCase().includes("i don't have access");

    res.json({
      text,
      videoId,
      title: `YouTube Video (${videoId})`,
      isSynthesized: true,   // always flag this so UI shows disclaimer
      couldNotFind,
    });
  } catch (error: any) {
    console.error("YouTube synthesis endpoint error:", error);
    res.status(500).json({
      error: error.message || "An error occurred during YouTube content synthesis.",
    });
  }
});

// 3. Generate Notes API
app.post("/api/generate-notes", async (req, res) => {
  try {
    const { transcript, title, depth } = req.body;
    if (!transcript) {
      return res
        .status(400)
        .json({ error: "A transcript is required to generate notes." });
    }

    const ai = getAi();
    const cleanDepth = depth || "standard";
    const cleanTitle = title || "Untitled Lecture";

    const prompt = `You are an expert academic writer and educational designer.
Convert the following raw lecture transcript into beautifully organized, rigorous master study notes.

Lecture Title: ${cleanTitle}
Note Depth: ${cleanDepth}

Structure your response in markdown format:

1. **Lecture Overview**: A 3-4 sentence abstract explaining the primary thesis, goals, and core outcomes.
2. **Core Theoretical Frameworks & Key Pillars**: Break down the major themes. For each concept:
   - High-level headings with detailed sub-points
   - **Bold** annotations for important statements
   - Mathematical equations in LaTeX ($$...$$ blocks or $...$ inline)
   - Code blocks with appropriate language tags
3. **Terminology Glossary**: Critical terms, definitions, parameters, formulas.
4. **Analogies & Real-world Applications**: Intuitive explanations to cement complex ideas.
5. **Self-Study Questions**: 4-6 conceptual review questions for critical analysis.

Raw lecture transcript:
"""
${transcript}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    res.json({ notes: response.text || "" });
  } catch (error: any) {
    console.error("Notes API error:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred while generating study notes." });
  }
});

// 4. Generate Quiz API
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { transcript, title, count } = req.body;
    if (!transcript) {
      return res
        .status(400)
        .json({ error: "A transcript is required to construct a quiz." });
    }

    const ai = getAi();
    const quizCount = Math.min(Math.max(Number(count) || 5, 3), 15);
    const cleanTitle = title || "Untitled Lecture";

    const prompt = `You are an expert curriculum supervisor. Generate an interactive, challenging quiz based on the key facts, frameworks, theories, and concepts in this lecture transcript.

Lecture Title: ${cleanTitle}
Number of questions: ${quizCount}

Mix Multiple-choice questions (exactly 4 options each) and True/False questions. Ensure answers are accurate and derived from the material.

Respond ONLY with a valid JSON object matching this structure exactly:
{
  "quizTitle": "string",
  "questions": [
    {
      "questionText": "string",
      "questionType": "multiple-choice" | "true-false",
      "options": ["string", "string", ...],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Raw Transcript:
"""
${transcript}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionText: { type: Type.STRING },
                  questionType: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: [
                  "questionText",
                  "questionType",
                  "options",
                  "correctAnswer",
                  "explanation",
                ],
              },
            },
          },
          required: ["quizTitle", "questions"],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Quiz API error:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred while building the quiz." });
  }
});

// 5. Generate Flashcards API
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { transcript, title, count } = req.body;
    if (!transcript) {
      return res
        .status(400)
        .json({ error: "A transcript is required to create flashcards." });
    }

    const ai = getAi();
    const cardCount = Math.min(Math.max(Number(count) || 8, 4), 20);
    const cleanTitle = title || "Untitled Lecture";

    const prompt = `You are an expert pedagogy researcher. Create an active-recall flashcard set summarizing core equations, laws, algorithms, and key vocabulary from this lecture.

Lecture Title: ${cleanTitle}
Number of flashcards: ${cardCount}

Rules:
- Front: a question, definition prompt, formula name, or key theoretical statement
- Back: a rich but concise answer, code snippet, definition, or solution
- Category: a brief tag for filtering (e.g., "Glossary", "Equation", "Fact", "Code", "Mechanism")

Respond ONLY with a valid JSON object:
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "category": "string"
    }
  ]
}

Raw Transcript:
"""
${transcript}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["front", "back", "category"],
              },
            },
          },
          required: ["flashcards"],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Flashcards API error:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred while generating flashcards." });
  }
});

// 6. Interactive Tutor Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const { transcript, messages, lectureTitle } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Lecture transcript context is missing." });
    }
    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "Chat message history is missing or invalid." });
    }

    const ai = getAi();
    const cleanTitle = lectureTitle || "Untitled Lecture";

    const chatHistoryText = messages
      .slice(-10)
      .map((m: any) => `${m.role === "user" ? "Student" : "Prof. AI"}: ${m.content}`)
      .join("\n\n");

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const compositePrompt = `You are "Prof. AI", an elite virtual academic coach mentoring a student on the lecture: "${cleanTitle}".

Verbatim lecture transcript for reference:
---
${transcript}
---

Guidelines:
1. Prioritize answers derived from this transcript.
2. For general academic context related to the lecture, explain with structural elegance.
3. Format math with LaTeX ($...$ inline, $$...$$ blocks) and code in markdown code blocks.
4. Be encouraging, clear, concise, and well-structured.

Current tutoring dialogue:
${chatHistoryText}

Student's message: "${lastUserMessage}"

Prof. AI response (clean markdown):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: compositePrompt }] }],
      config: {
        systemInstruction:
          "You are Prof. AI, a helpful and brilliant virtual lecture mentor. You structure explanations with headings, lists, LaTeX equations, and code formatting where appropriate.",
      },
    });

    res.json({ reply: response.text || "[No reply generated]" });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res
      .status(500)
      .json({ error: error.message || "An error occurred in tutor chat." });
  }
});

// ==========================================
// Vite Dev / Production Static Serve
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite dev server in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LectaVoice server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
