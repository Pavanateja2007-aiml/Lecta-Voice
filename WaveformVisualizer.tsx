import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null;
  active: boolean;
  color?: string;
  height?: number;
}

export function WaveformVisualizer({
  analyserNode,
  active,
  color = "#a78bfa",
  height = 64,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      if (!analyserNode || !active) {
        // Draw a flat idle line
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
        return;
      }

      const bufLen = analyserNode.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      analyserNode.getByteTimeDomainData(data);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();

      const sliceW = W / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = data[i] / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserNode, active, color, height]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height}
      className="w-full rounded-lg"
      style={{ height }}
    />
  );
}
