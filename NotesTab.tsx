import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, FileText, ChevronDown } from "lucide-react";
import type { NoteDepth } from "./index";

interface NotesTabProps {
  transcript: string;
  lectureTitle: string;
  notes: string;
  onNotesGenerated: (notes: string) => void;
}

const DEPTHS: { value: NoteDepth; label: string; desc: string }[] = [
  { value: "concise", label: "Concise", desc: "Key takeaways only" },
  { value: "standard", label: "Standard", desc: "Full curriculum coverage" },
  { value: "exhaustive", label: "Exhaustive", desc: "Deep-dive master notes" },
];

export function NotesTab({
  transcript,
  lectureTitle,
  notes,
  onNotesGenerated,
}: NotesTabProps) {
  const [depth, setDepth] = useState<NoteDepth>("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, title: lectureTitle, depth }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Failed to generate notes");
      onNotesGenerated(data.notes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {DEPTHS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDepth(d.value)}
              title={d.desc}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                depth === d.value
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading || !transcript}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileText size={14} />
          )}
          {notes ? "Regenerate Notes" : "Generate Notes"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!transcript && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Record or upload a lecture first to generate notes.
        </div>
      )}

      {transcript && !notes && !loading && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Select a depth and click <span className="text-violet-400">Generate Notes</span>.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-violet-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Crafting your study notes...</span>
        </div>
      )}

      {notes && !loading && (
        <div className="prose prose-invert prose-sm max-w-none bg-slate-800/40 border border-slate-700 rounded-xl p-5 overflow-auto">
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
