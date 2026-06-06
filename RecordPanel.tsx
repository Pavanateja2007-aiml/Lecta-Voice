import React, { useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Upload,
  Youtube,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAudioRecorder } from "./useAudioRecorder";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface RecordPanelProps {
  onTranscriptReady: (
    transcript: string,
    meta?: { youtubeVideoId?: string; isSynthesized?: boolean }
  ) => void;
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function RecordPanel({ onTranscriptReady }: RecordPanelProps) {
  const {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    analyserNode,
    error: recorderError,
    duration,
  } = useAudioRecorder();

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [synthesisWarning, setSynthesisWarning] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStopAndTranscribe = async () => {
    setError("");
    setStatus("Stopping recording...");
    const base64 = await stopRecording();
    if (!base64) {
      setError("No audio captured. Please try again.");
      setStatus("");
      return;
    }
    setStatus("Transcribing with Gemini AI...");
    setIsProcessing(true);
    try {
      const resp = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: "audio/webm" }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Transcription failed");
      setStatus("✓ Transcription complete");
      onTranscriptReady(data.text, {});
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError("File exceeds 25 MB limit. Please use a shorter recording.");
      return;
    }
    setError("");
    setStatus(`Processing "${file.name}"...`);
    setIsProcessing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const resp = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: file.type || "audio/webm" }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Transcription failed");
      setStatus("✓ File transcribed successfully");
      onTranscriptReady(data.text, {});
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleYouTube = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL.");
      return;
    }
    setError("");
    setSynthesisWarning("");
    setStatus("Searching for video content...");
    setIsProcessing(true);
    try {
      const resp = await fetch("/api/transcribe-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "YouTube synthesis failed");

      if (data.isSynthesized) {
        setSynthesisWarning(
          data.couldNotFind
            ? "⚠️ Gemini could not find specific content for this video. The result may be generic. Verify before studying."
            : "ℹ️ Note: Gemini cannot directly access YouTube audio. This content is synthesized from web search results about the video — not a real transcript. Review for accuracy."
        );
      }

      setStatus("✓ Content synthesized from web search");
      onTranscriptReady(data.text, {
        youtubeVideoId: data.videoId,
        isSynthesized: true,
      });
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isActive = isRecording || isPaused;

  return (
    <div className="space-y-5">
      {/* ── Live Microphone ── */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          Live Microphone
        </h3>

        <WaveformVisualizer analyserNode={analyserNode} active={isRecording} />

        {isActive && (
          <p className="text-center text-sm font-mono text-slate-300">
            {isPaused ? "⏸ Paused — " : "🔴 Recording — "}
            {formatDuration(duration)}
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          {!isActive && (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Mic size={15} /> Start Recording
            </button>
          )}
          {isRecording && (
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Pause size={15} /> Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Play size={15} /> Resume
            </button>
          )}
          {isActive && (
            <button
              onClick={handleStopAndTranscribe}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Square size={15} /> Stop & Transcribe
            </button>
          )}
          {!isActive && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Upload size={15} /> Upload File
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* ── YouTube ── */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-red-400 flex items-center gap-2">
          <Youtube size={14} /> YouTube Synthesis
        </h3>

        {/* Honest disclaimer — always visible */}
        <div className="flex gap-2 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2.5 text-xs text-amber-300">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            Gemini cannot access YouTube audio directly. It uses Google Search to find
            information about the video and synthesize educational content. Results are
            approximate — always verify.
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleYouTube()}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            onClick={handleYouTube}
            disabled={isProcessing || !youtubeUrl.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Youtube size={14} />}
            Synthesize
          </button>
        </div>

        {synthesisWarning && (
          <div className="flex gap-2 bg-slate-900/60 border border-slate-600 rounded-lg p-2.5 text-xs text-slate-300">
            <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
            <span>{synthesisWarning}</span>
          </div>
        )}
      </div>

      {/* ── Status & Error ── */}
      {(status || error || recorderError) && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            error || recorderError
              ? "bg-rose-950/60 border border-rose-800 text-rose-300"
              : "bg-slate-800 border border-slate-700 text-slate-300"
          }`}
        >
          {isProcessing && <Loader2 size={13} className="inline animate-spin mr-1.5" />}
          {error || recorderError || status}
        </div>
      )}
    </div>
  );
}
