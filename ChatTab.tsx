import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import type { ChatMessage } from "./index";

interface ChatTabProps {
  transcript: string;
  lectureTitle: string;
}

export function ChatTab({ transcript, lectureTitle }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    setError("");
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          messages: newMessages,
          lectureTitle,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Chat failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot size={32} className="mx-auto mb-3 text-violet-400 opacity-50" />
            <p className="text-slate-500 text-sm">
              {transcript
                ? `Ask Prof. AI anything about "${lectureTitle}"`
                : "Record or upload a lecture to start chatting with Prof. AI."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-700 text-violet-400"
              }`}
            >
              {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-violet-600/30 border border-violet-700 text-white"
                  : "bg-slate-800/70 border border-slate-700 text-slate-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl px-4 py-3">
              <Loader2 size={14} className="animate-spin text-violet-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2 mb-2">
          {error}
        </p>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={
            transcript ? "Ask anything about this lecture..." : "Load a lecture first..."
          }
          disabled={!transcript || loading}
          className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || !transcript || loading}
          className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl transition-colors"
        >
          <Send size={15} />
        </button>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-slate-400"
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
