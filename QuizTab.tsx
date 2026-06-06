import { useState } from "react";
import { Loader2, Trophy, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import type { Quiz, QuizAttempt } from "./index";

interface QuizTabProps {
  transcript: string;
  lectureTitle: string;
}

export function QuizTab({ transcript, lectureTitle }: QuizTabProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [attempts, setAttempts] = useState<Record<number, QuizAttempt>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const generate = async () => {
    setError("");
    setAttempts({});
    setShowExplanation({});
    setLoading(true);
    try {
      const resp = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, title: lectureTitle, count: questionCount }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Failed to generate quiz");
      setQuiz(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIdx: number, answer: string) => {
    if (attempts[qIdx]) return; // already answered
    const q = quiz!.questions[qIdx];
    setAttempts((prev) => ({
      ...prev,
      [qIdx]: {
        questionIndex: qIdx,
        selectedAnswer: answer,
        isCorrect: answer === q.correctAnswer,
      },
    }));
  };

  const score = Object.values(attempts).filter((a) => (a as QuizAttempt).isCorrect).length;
  const total = quiz?.questions.length ?? 0;
  const answered = Object.keys(attempts).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Questions:
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-violet-500"
          >
            {[3, 5, 8, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={generate}
          disabled={loading || !transcript}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
          {quiz ? "New Quiz" : "Generate Quiz"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!transcript && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Record or upload a lecture first to generate a quiz.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-violet-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Generating quiz questions...</span>
        </div>
      )}

      {quiz && !loading && (
        <div className="space-y-4">
          {/* Score bar */}
          {answered > 0 && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">
                {answered}/{total} answered
              </span>
              <span
                className={`font-bold text-sm ${
                  score / total >= 0.7 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {score}/{total} correct
              </span>
            </div>
          )}

          {quiz.questions.map((q, qi) => {
            const attempt = attempts[qi];
            return (
              <div
                key={qi}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3"
              >
                <p className="text-sm font-medium text-white">
                  <span className="text-violet-400 mr-2">{qi + 1}.</span>
                  {q.questionText}
                </p>

                <div className="grid gap-2">
                  {q.options.map((opt) => {
                    const selected = attempt?.selectedAnswer === opt;
                    const correct = attempt && opt === q.correctAnswer;
                    const wrong = selected && !attempt.isCorrect;

                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(qi, opt)}
                        disabled={!!attempt}
                        className={`text-left text-sm px-3 py-2 rounded-lg border transition-all ${
                          correct
                            ? "border-emerald-500 bg-emerald-950/50 text-emerald-300"
                            : wrong
                            ? "border-rose-500 bg-rose-950/50 text-rose-300"
                            : attempt && !selected
                            ? "border-slate-700 bg-slate-900/40 text-slate-500"
                            : "border-slate-600 bg-slate-900/40 hover:border-violet-500 text-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {correct && <CheckCircle size={13} className="text-emerald-400" />}
                          {wrong && <XCircle size={13} className="text-rose-400" />}
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {attempt && (
                  <div>
                    <button
                      onClick={() =>
                        setShowExplanation((p) => ({ ...p, [qi]: !p[qi] }))
                      }
                      className="text-xs text-violet-400 hover:text-violet-300 underline"
                    >
                      {showExplanation[qi] ? "Hide" : "Show"} explanation
                    </button>
                    {showExplanation[qi] && (
                      <p className="mt-2 text-xs text-slate-400 bg-slate-900/60 rounded-lg px-3 py-2">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
