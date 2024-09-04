// src/components/AudioWaveform.tsx
import React, { useEffect, useRef } from "react";

const AudioWaveform: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const bufferLengthRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      bufferLengthRef.current = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLengthRef.current);

      const draw = () => {
        if (
          !analyserRef.current ||
          !dataArrayRef.current ||
          !bufferLengthRef.current
        )
          return;

        requestAnimationFrame(draw);

        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#000001");
        gradient.addColorStop(0.5, "#4F19D6");
        gradient.addColorStop(1, "#000001");


        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = (canvas.width * 1.0) / bufferLengthRef.current;
        let x = 0;
        let isSilent = true;

        // Plot the sound wave, using the volume to guide the height
        for (let i = 0; i < bufferLengthRef.current; i++) {
          const volume = dataArrayRef.current[i] / 128.0;
          const y = (volume * canvas.height);

          if (i === 0) {
            ctx.moveTo(x, canvas.height / 2);
          } else {
            ctx.lineTo(x, y);
          }

          if (volume > 0.05) {
            isSilent = false;
          }

          x += sliceWidth;
        }

        // ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // Fill the area below the waveform only if there is significant sound
        if (!isSilent) {
          ctx.lineTo(canvas.width, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      };

      draw();
    });

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center bg-black">
      <canvas ref={canvasRef} className="w-[80vw] rounded-lg"></canvas>
    </div>
  );
};

export default AudioWaveform;
