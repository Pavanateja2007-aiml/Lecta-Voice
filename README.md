# 🎙️ LectaVoice — AI Lecture Companion

> **Record a lecture. Get study notes, quizzes, flashcards, and a personal AI tutor — instantly.**

LectaVoice is a full-stack AI-powered web app that transforms raw lecture audio (or YouTube videos) into a complete, structured study package. It uses **Google Gemini** under the hood and is built with **React + TypeScript** on the frontend and **Express + Vite** on the backend.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Live Audio Recording** | Record lectures directly in the browser with real-time waveform visualization |
| 📁 **Audio File Upload** | Upload pre-recorded `.webm`, `.mp3`, `.wav`, etc. for transcription |
| 📺 **YouTube Import** | Paste a YouTube URL to synthesize educational content via Google Search grounding |
| 📝 **AI Study Notes** | Generates structured markdown notes with headings, glossaries, LaTeX equations, code blocks, and review questions |
| 🧪 **Interactive Quiz** | Auto-generates multiple-choice and true/false questions with correct answers and explanations |
| 🃏 **Flashcards** | Spaced-repetition-style flashcard deck with front/back/category — generated from the transcript |
| 💬 **Prof. AI Chat** | Context-aware tutor chat that answers questions grounded in the lecture transcript |
| 💾 **Persistent Storage** | All lectures and notes are persisted in `localStorage` — no account needed |

---

## 🏗️ Architecture

```
Browser (React + Vite SPA)
│
├── RecordPanel.tsx       → Mic recording / audio file upload / YouTube URL input
├── WaveformVisualizer.tsx → Real-time audio waveform canvas
├── NotesTab.tsx          → Study notes viewer (markdown rendered)
├── QuizTab.tsx           → Interactive quiz with scoring
├── FlashcardsTab.tsx     → Flip-card study deck
├── ChatTab.tsx           → Streaming Prof. AI tutor chat
├── useAudioRecorder.ts   → MediaRecorder hook
└── useLocalStorage.ts    → Typed localStorage hook

Express Server (server.ts)
│
├── POST /api/transcribe            → Gemini audio transcription
├── POST /api/transcribe-youtube    → Gemini + Google Search content synthesis
├── POST /api/generate-notes        → Gemini structured study notes
├── POST /api/generate-quiz         → Gemini JSON-schema quiz generation
├── POST /api/generate-flashcards   → Gemini JSON-schema flashcard generation
└── POST /api/chat                  → Gemini tutor chat (last 10 messages context)
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express, TypeScript
- **AI:** Google Gemini 2.0 Flash (`@google/genai`) — transcription, notes, quiz, flashcards, chat
- **Search Grounding:** Google Search tool (for YouTube content synthesis)
- **Storage:** Browser `localStorage` (no database required)

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/Pavanateja2007-aiml/Lecta-Voice.git
cd Lecta-Voice
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create (or edit) the `.env` file in the root:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Start the development server

```bash
npm run dev
```

The app runs at **http://localhost:3000**.

---

## 🚀 Usage

1. **Create a Lecture** — Click **New Lecture** in the sidebar.
2. **Record or Import** — Choose one of:
   - 🎤 Record live audio from your microphone
   - 📁 Upload an existing audio file
   - 📺 Paste a YouTube URL
3. **Generate Content** — Once the transcript is ready, navigate the four tabs:
   - **Study Notes** — Click *Generate Notes* for AI-structured notes
   - **Quiz** — Click *Generate Quiz* to test your knowledge
   - **Flashcards** — Click *Generate Flashcards* for a study deck
   - **Prof. AI** — Ask the AI tutor any question about the lecture
4. **Manage Lectures** — Rename or delete lectures from the sidebar. Your data persists across sessions via `localStorage`.

> ⚠️ **YouTube Note:** Gemini cannot directly access YouTube audio/video streams. When you import a YouTube URL, the app uses Google Search grounding to synthesize educational content about the video. Content is clearly labeled **Synthesized** — always review for accuracy.

---

## 📁 Project Structure

```
Lecta-Voice/
├── App.tsx                  # Root component, sidebar, lecture management
├── RecordPanel.tsx          # Audio recording / upload / YouTube import UI
├── WaveformVisualizer.tsx   # Canvas-based real-time audio waveform
├── NotesTab.tsx             # Study notes generation & display
├── QuizTab.tsx              # Quiz generation & interactive answering
├── FlashcardsTab.tsx        # Flashcard deck generation & flip UI
├── ChatTab.tsx              # Prof. AI tutor chat interface
├── useAudioRecorder.ts      # Custom hook: MediaRecorder + waveform data
├── useLocalStorage.ts       # Custom hook: typed persistent state
├── index.ts                 # Shared TypeScript types (Lecture, ActiveTab)
├── server.ts                # Express server + all Gemini API endpoints
├── index.html               # HTML entry point
├── main.tsx                 # React DOM render
├── index.css                # Global styles
├── vite.config.ts           # Vite + proxy config
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies & scripts
└── .env                     # API keys (not committed)
```

---

## 🔌 API Endpoints

All endpoints are served by the Express backend at `/api/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/transcribe` | Transcribe base64-encoded audio via Gemini |
| `POST` | `/api/transcribe-youtube` | Synthesize content from a YouTube URL using Google Search |
| `POST` | `/api/generate-notes` | Generate structured study notes from a transcript |
| `POST` | `/api/generate-quiz` | Generate a JSON quiz (MCQ + true/false) |
| `POST` | `/api/generate-flashcards` | Generate a JSON flashcard deck |
| `POST` | `/api/chat` | Tutor chat response grounded in the transcript |

---

## 🔮 Roadmap

- [ ] Real-time streaming transcription
- [ ] Multi-language support (including Indian regional languages)
- [ ] Mobile app (React Native)
- [ ] User accounts & cloud sync
- [ ] Export notes to PDF / Word
- [ ] Offline mode with on-device models

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Pavanateja Vemuri**  
GitHub: [@Pavanateja2007-aiml](https://github.com/Pavanateja2007-aiml)
