import React, { useState } from "react";
import {
  BookOpen,
  Trophy,
  Layers,
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Mic,
  Youtube,
  ChevronRight,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";
import { RecordPanel } from "./RecordPanel";
import { NotesTab } from "./NotesTab";
import { QuizTab } from "./QuizTab";
import { FlashcardsTab } from "./FlashcardsTab";
import { ChatTab } from "./ChatTab";
import type { Lecture, ActiveTab } from "./index";

const TABS: { id: ActiveTab; label: string; Icon: React.ElementType }[] = [
  { id: "notes", label: "Study Notes", Icon: BookOpen },
  { id: "quiz", label: "Quiz", Icon: Trophy },
  { id: "flashcards", label: "Flashcards", Icon: Layers },
  { id: "chat", label: "Prof. AI", Icon: MessageSquare },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function App() {
  const [lectures, setLectures] = useLocalStorage<Lecture[]>("lectavoice_lectures", []);
  const [activeLectureId, setActiveLectureId] = useLocalStorage<string | null>(
    "lectavoice_active",
    null
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecord, setShowRecord] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const activeLecture = lectures.find((l) => l.id === activeLectureId) ?? null;

  const filteredLectures = lectures.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createLecture = () => {
    const newLecture: Lecture = {
      id: generateId(),
      title: `Lecture ${lectures.length + 1}`,
      createdAt: new Date().toISOString(),
      transcript: "",
      notes: "",
    };
    setLectures((prev) => [newLecture, ...prev]);
    setActiveLectureId(newLecture.id);
    setShowRecord(true);
    setActiveTab("notes");
  };

  const deleteLecture = (id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
    if (activeLectureId === id) {
      const remaining = lectures.filter((l) => l.id !== id);
      setActiveLectureId(remaining[0]?.id ?? null);
    }
  };

  const updateLecture = (id: string, updates: Partial<Lecture>) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleTranscriptReady = (
    transcript: string,
    meta?: { youtubeVideoId?: string; isSynthesized?: boolean }
  ) => {
    if (!activeLectureId) return;
    updateLecture(activeLectureId, {
      transcript,
      youtubeVideoId: meta?.youtubeVideoId,
      isSynthesized: meta?.isSynthesized,
      notes: "", // clear stale notes
    });
    setShowRecord(false);
    setActiveTab("notes");
  };

  const startEditTitle = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setEditTitle(lecture.title);
  };

  const commitEditTitle = () => {
    if (editingId && editTitle.trim()) {
      updateLecture(editingId, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Mic size={15} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">LectaVoice</h1>
              <p className="text-xs text-slate-500">AI Lecture Companion</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
            <Search size={13} className="text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures..."
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            />
          </div>
        </div>

        {/* New lecture button */}
        <div className="px-3 py-2.5">
          <button
            onClick={createLecture}
            className="w-full flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} /> New Lecture
          </button>
        </div>

        {/* Lecture list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {filteredLectures.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-6">No lectures yet</p>
          )}
          {filteredLectures.map((lec) => (
            <div
              key={lec.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                activeLectureId === lec.id
                  ? "bg-slate-800 border border-slate-700"
                  : "hover:bg-slate-800/50"
              }`}
              onClick={() => { setActiveLectureId(lec.id); setShowRecord(false); }}
            >
              <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center shrink-0">
                {lec.youtubeVideoId ? (
                  <Youtube size={11} className="text-red-400" />
                ) : (
                  <Mic size={11} className="text-violet-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {editingId === lec.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEditTitle();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="bg-slate-700 text-white text-xs rounded px-1.5 py-0.5 w-full outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); commitEditTitle(); }}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-white truncate">{lec.title}</p>
                )}
                <p className="text-xs text-slate-500">
                  {new Date(lec.createdAt).toLocaleDateString()}
                </p>
              </div>

              {editingId !== lec.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditTitle(lec); }}
                    className="p-1 hover:text-violet-400 text-slate-500"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLecture(lec.id); }}
                    className="p-1 hover:text-rose-400 text-slate-500"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {!activeLecture ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-700 flex items-center justify-center mx-auto">
                <Mic size={28} className="text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome to LectaVoice</h2>
              <p className="text-slate-500 text-sm max-w-xs">
                Create a new lecture to start recording, uploading, or importing YouTube content.
              </p>
              <button
                onClick={createLecture}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors mx-auto"
              >
                <Plus size={15} /> Create First Lecture
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  {activeLecture.youtubeVideoId ? (
                    <Youtube size={13} className="text-red-400" />
                  ) : (
                    <Mic size={13} className="text-violet-400" />
                  )}
                </div>
                <h2 className="font-semibold text-white truncate">{activeLecture.title}</h2>
                {activeLecture.isSynthesized && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded-full px-2 py-0.5 shrink-0">
                    <AlertTriangle size={10} /> Synthesized
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowRecord((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <Mic size={12} />
                {activeLecture.transcript ? "Re-record" : "Record / Import"}
                <ChevronRight size={12} className={`transition-transform ${showRecord ? "rotate-90" : ""}`} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
                {/* Record panel (collapsible) */}
                {showRecord && (
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                    <RecordPanel onTranscriptReady={handleTranscriptReady} />
                  </div>
                )}

                {/* Synthesized content warning */}
                {activeLecture.isSynthesized && (
                  <div className="flex gap-2.5 bg-amber-950/30 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-300">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>
                      This lecture content was synthesized via web search — not directly transcribed from the video audio. 
                      Review the content for accuracy before using it for serious study.
                    </span>
                  </div>
                )}

                {/* Transcript preview */}
                {activeLecture.transcript && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors list-none flex items-center gap-2">
                      <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                      Transcript Preview
                    </summary>
                    <div className="mt-2 bg-slate-800/40 border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {activeLecture.transcript.slice(0, 1500)}
                        {activeLecture.transcript.length > 1500 && (
                          <span className="text-slate-600">... (truncated)</span>
                        )}
                      </p>
                    </div>
                  </details>
                )}

                {/* Tabs */}
                <div>
                  <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 mb-5">
                    {TABS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          activeTab === id
                            ? "bg-violet-600 text-white shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon size={13} />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    {activeTab === "notes" && (
                      <NotesTab
                        transcript={activeLecture.transcript}
                        lectureTitle={activeLecture.title}
                        notes={activeLecture.notes}
                        onNotesGenerated={(notes) => updateLecture(activeLecture.id, { notes })}
                      />
                    )}
                    {activeTab === "quiz" && (
                      <QuizTab
                        transcript={activeLecture.transcript}
                        lectureTitle={activeLecture.title}
                      />
                    )}
                    {activeTab === "flashcards" && (
                      <FlashcardsTab
                        transcript={activeLecture.transcript}
                        lectureTitle={activeLecture.title}
                      />
                    )}
                    {activeTab === "chat" && (
                      <ChatTab
                        transcript={activeLecture.transcript}
                        lectureTitle={activeLecture.title}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
