import { useState } from "react";
import { Loader2, Layers, Check, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Flashcard } from "./index";

interface FlashcardsTabProps {
  transcript: string;
  lectureTitle: string;
}

export function FlashcardsTab({ transcript, lectureTitle }: FlashcardsTabProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardCount, setCardCount] = useState(8);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const generate = async () => {
    setError("");
    setLoading(true);
    setCurrentIdx(0);
    setFlipped(false);
    setFilterCategory("All");
    try {
      const resp = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, title: lectureTitle, count: cardCount }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Failed to generate flashcards");
      setCards((data.flashcards || []).map((c: Flashcard) => ({ ...c, mastered: false })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(cards.map((c) => c.category)))];
  const filtered =
    filterCategory === "All" ? cards : cards.filter((c) => c.category === filterCategory);
  const card = filtered[currentIdx];
  const masteredCount = filtered.filter((c) => c.mastered).length;

  const toggleMastered = () => {
    if (!card) return;
    const globalIdx = cards.indexOf(card);
    setCards((prev) =>
      prev.map((c, i) => (i === globalIdx ? { ...c, mastered: !c.mastered } : c))
    );
  };

  const nav = (dir: 1 | -1) => {
    setFlipped(false);
    setCurrentIdx((i) => Math.max(0, Math.min(filtered.length - 1, i + dir)));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Cards:
          <select
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-violet-500"
          >
            {[4, 6, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button
          onClick={generate}
          disabled={loading || !transcript}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
          {cards.length ? "Regenerate" : "Generate Flashcards"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!transcript && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Record or upload a lecture first to generate flashcards.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-violet-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Generating flashcards...</span>
        </div>
      )}

      {cards.length > 0 && !loading && (
        <div className="space-y-4">
          {/* Stats + category filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 rounded-full px-3 py-1">
              {masteredCount}/{filtered.length} mastered
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setFilterCategory(cat); setCurrentIdx(0); setFlipped(false); }}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterCategory === cat
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 3D Flip Card */}
          {card && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-full max-w-lg cursor-pointer"
                style={{ perspective: "1200px", height: "220px" }}
                onClick={() => setFlipped((f) => !f)}
              >
                <div
                  style={{
                    transition: "transform 0.5s cubic-bezier(0.4,0.2,0.2,1)",
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* Front */}
                  <div
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl border p-6 text-center ${
                      card.mastered
                        ? "bg-emerald-950/40 border-emerald-700"
                        : "bg-slate-800/80 border-slate-600"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">
                      {card.category}
                    </span>
                    <p className="text-white font-medium text-base leading-relaxed">{card.front}</p>
                    <p className="text-xs text-slate-500 mt-4">Click to flip</p>
                  </div>

                  {/* Back */}
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-violet-950/50 border-violet-700 p-6 text-center"
                  >
                    <p className="text-violet-100 text-sm leading-relaxed">{card.back}</p>
                    <p className="text-xs text-slate-500 mt-4">Click to flip back</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => nav(-1)}
                  disabled={currentIdx === 0}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-slate-400">
                  {currentIdx + 1} / {filtered.length}
                </span>
                <button
                  onClick={() => nav(1)}
                  disabled={currentIdx === filtered.length - 1}
                  className="p-2 bg-slate-800 border border-slate-700 rounded-lg disabled:opacity-30 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Mastered toggle */}
              <button
                onClick={toggleMastered}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${
                  card.mastered
                    ? "bg-emerald-950/50 border-emerald-700 text-emerald-300 hover:bg-emerald-900/50"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Check size={14} />
                {card.mastered ? "Mastered ✓" : "Mark as Mastered"}
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">No cards in this category.</p>
          )}
        </div>
      )}
    </div>
  );
}
