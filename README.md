🎙️ Lecta-Voice

Lecta-Voice is a voice-enabled AI assistant system designed to enhance interactive learning experiences using speech-based input and output. It integrates voice recognition, natural language processing (NLP), and AI-driven responses to create a seamless conversational interface for educational and assistant-based applications.

🚀 Features
🎤 Speech-to-Text (STT) – Convert user voice input into text using modern ASR models
🧠 AI Response Engine – Processes queries using NLP/LLM-based logic
🔊 Text-to-Speech (TTS) – Generates natural voice responses
📚 Education-Focused Design – Built around learning and interactive tutoring use cases
⚡ Fast Voice Interaction Pipeline – Low-latency conversational flow
🌐 Extensible Architecture – Easily integrate APIs, models, or custom datasets
🏗️ System Architecture

Lecta-Voice follows a simple voice pipeline:

User Speech
   ↓
Speech-to-Text (STT)
   ↓
AI/NLP Processing (LLM / Logic Engine)
   ↓
Text Response
   ↓
Text-to-Speech (TTS)
   ↓
Voice Output
📁 Project Structure
Lecta-Voice/
│
├── backend/               # Core AI logic & API services
│   ├── stt/               # Speech-to-text modules
│   ├── nlp/               # AI response / LLM integration
│   ├── tts/               # Text-to-speech engine
│
├── frontend/             # UI for voice interaction (web/app)
│
├── models/               # Pretrained or fine-tuned models
│
├── utils/               # Helper functions (audio processing, etc.)
│
├── config/              # Configuration files
│
├── app.py               # Main entry point
├── requirements.txt     # Python dependencies
└── README.md
⚙️ Installation
1. Clone the repository
git clone https://github.com/Pavanateja2007-aiml/Lecta-Voice.git
cd Lecta-Voice
2. Create virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
3. Install dependencies
pip install -r requirements.txt
▶️ Running the Project
python app.py

Or run backend services individually:

python backend/stt/main.py
python backend/nlp/main.py
python backend/tts/main.py
🧠 How It Works
User speaks into microphone
Audio is processed by Speech-to-Text module
Converted text is sent to AI/NLP engine
System generates an intelligent response
Response is converted back to speech using TTS engine
User hears the final output
🛠️ Tech Stack
Python 🐍
SpeechRecognition / Whisper / ASR models
NLP / LLM APIs (OpenAI or custom models)
Text-to-Speech (pyttsx3 / ElevenLabs / Coqui TTS)
Flask / FastAPI (backend API layer)
JavaScript (frontend optional)
🎯 Use Cases
AI Voice Tutor for students
Hands-free learning assistant
Smart classroom interaction system
Voice-based Q&A system
Accessibility support tool
🔮 Future Improvements
Real-time conversational streaming
Multi-language support (Indian languages included)
Emotion-aware voice responses
Mobile app integration
Offline voice assistant mode
🤝 Contributing

Contributions are welcome!

Fork the repo
Create a new branch
Commit changes
Push and open a pull request
📄 License

This project is licensed under the MIT License.

👨‍💻 Author

Pavanateja Vemuri
GitHub: Pavanateja2007-aiml
