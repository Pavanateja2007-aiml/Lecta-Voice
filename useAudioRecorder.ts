import { useRef, useState, useCallback, useEffect } from "react";
import type { RecordingState } from "./index";

interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<string | null>; // returns base64 audio
  analyserNode: AnalyserNode | null;
  error: string | null;
  duration: number; // seconds
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up AnalyserNode for waveform visualization
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      setAnalyserNode(analyser);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setRecordingState("recording");

      clearTimer();
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Could not access microphone.");
      setRecordingState("idle");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      clearTimer();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      clearTimer();
      setRecordingState("processing");

      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        setRecordingState("idle");
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioContextRef.current?.close();
        setAnalyserNode(null);

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          setRecordingState("idle");
          resolve(base64);
        };
        reader.onerror = () => {
          setError("Failed to read audio data.");
          setRecordingState("idle");
          resolve(null);
        };
        reader.readAsDataURL(blob);
      };

      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        setRecordingState("idle");
        resolve(null);
      }
    });
  }, []);

  return {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    analyserNode,
    error,
    duration,
  };
}
