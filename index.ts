// ==============================
// Lecture & Lecture Session Types
// ==============================

export interface Lecture {
  id: string;
  title: string;
  createdAt: string;
  transcript: string;
  notes: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  isSynthesized?: boolean; // true when content came from YouTube synthesis (not real audio)
}

// ==============================
// Quiz Types
// ==============================

export type QuestionType = "multiple-choice" | "true-false";

export interface QuizQuestion {
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  quizTitle: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  questionIndex: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

// ==============================
// Flashcard Types
// ==============================

export interface Flashcard {
  front: string;
  back: string;
  category: string;
  mastered?: boolean;
}

// ==============================
// Chat Types
// ==============================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ==============================
// App State Types
// ==============================

export type ActiveTab = "notes" | "quiz" | "flashcards" | "chat";
export type NoteDepth = "concise" | "standard" | "exhaustive";
export type RecordingState = "idle" | "recording" | "paused" | "processing";
